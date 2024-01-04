export class Election {
  id: number
  name: string
  startsAt: bigint
  endsAt: bigint
  candidates: unknown[]
  totalVotes: number
  voters: string[]

  constructor({ endsAt, id, name, startsAt, candidates, totalVotes, voters }: Election) {
    this.id = id
    this.endsAt = endsAt
    this.name = name
    this.startsAt = startsAt
    this.totalVotes = totalVotes
    this.candidates = candidates
    this.voters = voters
  }
}