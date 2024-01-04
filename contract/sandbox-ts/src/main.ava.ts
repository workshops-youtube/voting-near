import { Worker, NearAccount } from 'near-workspaces';
import anyTest, { TestFn } from 'ava';
import { Candidate, Election } from '../../src/model';

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;

test.beforeEach(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();

  // Deploy contract
  const root = worker.rootAccount;
  const contract = await root.createSubAccount('test-account');
  // Get wasm file path from package.json test script in folder above
  await contract.deploy(
    process.argv[2],
  );

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.accounts = { root, contract };
});

test.afterEach.always(async (t) => {
  // Stop Sandbox server
  await t.context.worker.tearDown().catch((error) => {
    console.log('Failed to stop the Sandbox:', error);
  });
});

test("election can be created", async (t) => {
  const { contract, root } = t.context.accounts
  
  const now = new Date().getTime()

  // Create election
  await root.call(contract, "create_election", {
    endsAt: now + 1000 * 60 * 60,
    name: "Test Election",
    startsAt: now, 
  })

  const election: Election = await contract.view("get_election", { electionId: 0 })

  t.not(election, null)
})

test("candidate can be added to election", async (t) => {
  const { contract, root } = t.context.accounts
  
  const now = new Date().getTime()

  // Create election
  await root.call(contract, "create_election", {
    endsAt: now + 1000 * 60 * 60,
    name: "Test Election",
    startsAt: now, 
  })

  // Add candidate
  await root.call(contract, "add_candidate_to_election", {
    accountId: "test.accountId", 
    electionId: 0
  })

  // Get all candidates from election
  const candidates: Election = await contract.view("get_candidates_by_election", { electionId: 0 })

  t.deepEqual(candidates[0], { 
    accountId: 'test.accountId', totalVotes: 0 
  })
})

test("can vote", async (t) => {
  const { contract, root } = t.context.accounts
  
  const now = new Date().getTime()

  // Create election
  await root.call(contract, "create_election", {
    endsAt: now + 1000 * 60 * 60,
    name: "Test Election",
    startsAt: now, 
  })

  // Add candidate
  await root.call(contract, "add_candidate_to_election", {
    accountId: "test.accountId", 
    electionId: 0
  })

   // Add another candidate
   await root.call(contract, "add_candidate_to_election", {
    accountId: "test.accountId2", 
    electionId: 0
  })

  // Vote
  await root.call(contract, "vote", {
    electionId: 0,
    candidateId: "test.accountId"
  })

  const candidates: Candidate[] = await contract.view("get_candidates_by_election", { electionId: 0 })

  t.is(candidates[0].totalVotes, 1)
  t.is(candidates[1].totalVotes, 0)
})

test("cannot add candidate if election has not started", async (t) => {
  const { contract, root } = t.context.accounts
  
  const now = new Date().getTime()

  // Create election
  await root.call(contract, "create_election", {
    endsAt: now + 1000 * 60 * 60,
    name: "Test Election",
    startsAt: now + 1000 * 60 * 1, 
  })

  // Try adding candidate
  await t.throwsAsync(async () => {
    await root.call(contract, "add_candidate_to_election", {
      accountId: "test.accountId", 
      electionId: 0
    }), { instanceof: Error, message: "Election has not started or has already been finished." }
  })
})


test("cannot add candidate if election has already ended", async (t) => {
  const { contract, root } = t.context.accounts
  
  const now = new Date().getTime()

  // Create election
  await root.call(contract, "create_election", {
    endsAt: now,
    name: "Test Election",
    startsAt: now, 
  })

  // Try adding candidate
  await t.throwsAsync(async () => {
    await root.call(contract, "add_candidate_to_election", {
      accountId: "test.accountId", 
      electionId: 0
    }), { instanceof: Error, message: "Election has not started or has already been finished." }
  })
})

  // const electionObj = {
  //   id: 0,
  //   startsAt: BigInt(now * (10 ** 6)), //Converting javascript milliseconds to near blockchain standard nanoseconds
  //   endsAt: BigInt((now + 1000 * 60 * 60) * (10 ** 6)), //Converting javascript milliseconds to near blockchain standard nanoseconds
  //   name: "Test Election", 
  //   candidates: [], 
  //   voters: [],
  //   totalVotes: 0 
  // }