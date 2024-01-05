import { NearBindgen, call, view, initialize, UnorderedMap, assert, near } from 'near-sdk-js';
import {  Candidate, Election, Voter} from './model';

@NearBindgen({})
class VotingNear {
  electionsCounterId: number
  elections: UnorderedMap<Election> = new UnorderedMap<Election>("elections")

  @initialize({})
  init() {
    this.electionsCounterId = 0
  }

  @view({})
  get_all_elections() {
    return this.elections.toArray().reverse()
  }

  @view({})
  get_election({ electionId }: { electionId: number }): Election {
    return this.elections.get(String(electionId))
  }

  @call({})
  create_election({ endsAt, name, startsAt }: Election): void {
    const election = new Election(
      { 
        id: this.electionsCounterId,
        startsAt: BigInt(Number(startsAt) * 10 ** 6),
        endsAt: BigInt(Number(endsAt) * 10 ** 6),
        name, 
        candidates: [], 
        voters: [],
        totalVotes: 0 
      }
    )
    this.elections.set(String(this.electionsCounterId), election)
    this.electionsCounterId += 1
  }

  @call({})
  add_candidate({ accountId, electionId }: { accountId: string, electionId: number }): void {
    const electionToAddCandidate = this.elections.get(String(electionId))
    assert(electionToAddCandidate !== null, "Election not found.")

    const candidateAlreadyExists = this.verifyCandidateExistence(electionId, accountId)
    assert(!candidateAlreadyExists, "Candidate has already been added.")

    const candidate = new Candidate({
      accountId,
      totalVotes: 0
    })

    electionToAddCandidate.candidates.push(candidate)
    this.elections.set(String(electionId), electionToAddCandidate)
  }

  @call({})
  vote({ candidateId, electionId }: { candidateId: string, electionId: number }): void {
    const election = this.elections.get(String(electionId))
    assert(election !== null, "Election not found.")

    const electionIsHappening = this.verifyElectionIsHappening(electionId)
    assert(electionIsHappening, "Election is not happening.")

    const alreadyVoted = election.voters.filter(({ accountId }) => {
      return accountId === near.signerAccountId()
    }).length === 1
    assert(!alreadyVoted, "User has already voted.")

    const candidateExists = this.verifyCandidateExistence(electionId, candidateId)
    assert(candidateExists, "Candidate not found.")

    const voter = new Voter({
      accountId: near.signerAccountId(),
      votedAt: near.blockTimestamp(),
      votedCandidateAccountId: candidateId
    }) 

    election.voters.push(voter)
    election.totalVotes += 1
    election.candidates.filter(({ accountId }) => {
      return accountId === candidateId
    })[0].totalVotes += 1

    this.elections.set(String(electionId), election)
  }

  verifyCandidateExistence(electionId: number, candidateId: string): boolean {
    const candidates = this.elections.get(String(electionId)).candidates

    if (candidates === null) {
      return false
    } else {
      const candidate = candidates.filter(({ accountId }) => {
        return accountId === candidateId
      })

      const exists = candidate.length === 1

      return exists
    }
  }

  verifyElectionIsHappening(electionId: number): boolean {
    const election = this.elections.get(String(electionId))

    const now = near.blockTimestamp()

    const isHappening = election.startsAt < now && election.endsAt > now

    return isHappening
  }
}

