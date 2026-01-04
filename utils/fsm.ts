import fsms from '~/assets/fsms.json'
import fsmMain from '~/assets/fsm-main.json'

export type FSMName = 'main' | (keyof typeof fsms)

type FSMOptions = {
  transition: number[][]
  emission: number[]
  initial: number[]
}

export class FSM {
  static load(name: FSMName): FSM {
    const config = name === 'main' ? fsmMain : fsms[name]
    return new FSM(config)
  }

  static makeSingle(p: number): FSM {
    return new FSM({
      transition: [[1]],
      emission: [p],
      initial: [1],
    })
  }

  private state: number
  constructor(private options: FSMOptions) {
    this.state = this.sampleInitial()
  }

  private sampleInitial(): number {
    return this.sampleFrom(this.options.initial)
  }

  step(): boolean {
    const emission = random.float() < this.options.emission[this.state]
    this.state = this.sampleFrom(this.options.transition[this.state])
    return emission
  }

  private sampleFrom(probs: number[]): number {
    const r = random.float()
    let cumulative = 0
    for (let i = 0; i < probs.length; i++) {
      cumulative += probs[i]
      if (r < cumulative) return i
    }
    return probs.length - 1
  }

  reset(): void {
    this.state = this.sampleInitial()
  }
}
