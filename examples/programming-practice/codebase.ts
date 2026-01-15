/**
 * バハムート駆動開発：最終形態の TypeScript 変換例
 */

// --- Domain/Summon/ValueObjects ---

export class SummonId {
  constructor(private readonly value: string) {}
  equals(other: SummonId): boolean {
    return this.value === other.value;
  }
}

export class SummonName {
  constructor(private readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

export enum ElementType {
  Fire = "Fire",
  Ice = "Ice",
  Water = "Water",
  None = "None",
}

export class Element {
  constructor(public readonly type: ElementType) {}
}

// --- Domain/Summon/Traits (as Mixins or Composition) ---

// TypeScriptではTraitをMixinとして実現することが多いです
type Constructor<T = {}> = new (...args: any[]) => T;

export function WithSummonAnimation<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    playSummonAnimation(): string {
      return "Playing a grand summon animation!";
    }
  };
}

// --- Domain/Summon/Interfaces ---

export interface SummonBeast {
  id(): SummonId;
  element(): Element;
  castSummon(): string;
  mp(): number;
}

// --- Domain/Summon/Entities ---

export abstract class BaseSummonBeast implements SummonBeast {
  constructor(
    protected readonly _id: SummonId,
    protected readonly _element: Element
  ) {}

  id(): SummonId {
    return this._id;
  }

  element(): Element {
    return this._element;
  }

  abstract castSummon(): string;
  abstract mp(): number;
}

export class Bahamut extends BaseSummonBeast {
  constructor(id: SummonId) {
    super(id, new Element(ElementType.None));
  }
  castSummon(): string { return "Mega Flare!"; }
  mp(): number { return 450; }
}

export class BahamutZero extends WithSummonAnimation(Bahamut) {
  castSummon(): string { return "Tera Flare!"; }
  mp(): number { return 520; }
}

export class Shiva extends BaseSummonBeast {
  constructor(id: SummonId) {
    super(id, new Element(ElementType.Ice));
  }
  castSummon(): string { return "Diamond Dust!"; }
  mp(): number { return 380; }
}

export class ShivaZero extends WithSummonAnimation(Shiva) {
  castSummon(): string { return "Heavenly Strike!"; }
  mp(): number { return 440; }
}

export class Ifrit extends BaseSummonBeast {
  constructor(id: SummonId) {
    super(id, new Element(ElementType.Fire));
  }
  castSummon(): string { return "Hellfire!"; }
  mp(): number { return 450; }
}

export class IfritZero extends WithSummonAnimation(Ifrit) {
  castSummon(): string { return "Inferno Storm!"; }
  mp(): number { return 520; }
}

export class Leviathan extends BaseSummonBeast {
  constructor(id: SummonId) {
    super(id, new Element(ElementType.Water));
  }
  castSummon(): string { return "Tidal Wave!"; }
  mp(): number { return 400; }
}

export class LeviathanZero extends WithSummonAnimation(Leviathan) {
  castSummon(): string { return "Tsunami Barrage!"; }
  mp(): number { return 480; }
}

// --- Domain/Summon/Factory ---

export class SummonFactory {
  static create(name: string, id: SummonId): SummonBeast {
    switch (name) {
      case "Bahamut": return new Bahamut(id);
      case "BahamutZero": return new BahamutZero(id);
      case "Shiva": return new Shiva(id);
      case "ShivaZero": return new ShivaZero(id);
      case "Ifrit": return new Ifrit(id);
      case "IfritZero": return new IfritZero(id);
      case "Leviathan": return new Leviathan(id);
      case "LeviathanZero": return new LeviathanZero(id);
      default: throw new Error(`Unknown summon: ${name}`);
    }
  }
}

// --- Domain/Summon/Repository Interface ---

export interface SummonRepository {
  save(summon: SummonBeast): Promise<void>;
  findById(id: SummonId): Promise<SummonBeast | null>;
}

// --- Domain/Battle/Service ---

export class ElementCompatibilityCalculator {
  static calculateMultiplier(attacker: Element, defender: Element): number {
    if (attacker.type === ElementType.Fire && defender.type === ElementType.Ice) return 2.0;
    if (attacker.type === ElementType.Ice && defender.type === ElementType.Fire) return 0.5;
    // ... other logic
    return 1.0;
  }
}
