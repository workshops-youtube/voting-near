import { NearBindgen, near, call, view, initialize, UnorderedMap, assert } from 'near-sdk-js';
import { Election } from './model';


@NearBindgen({})
class VotingNear {
  electionsCounterId: number = 0
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
}

