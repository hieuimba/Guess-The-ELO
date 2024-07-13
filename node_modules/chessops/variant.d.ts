import { Result } from '@badrap/result';
import { Square, Outcome, Color, Piece, Rules } from './types.js';
import { SquareSet } from './squareSet.js';
import { Setup } from './setup.js';
import { PositionError, Position, IllegalSetup, Context, Chess, Castles, FromSetupOpts, castlingSide, equalsIgnoreMoves, normalizeMove } from './chess.js';
export { Position, PositionError, IllegalSetup, Context, Chess, Castles, equalsIgnoreMoves, castlingSide, normalizeMove, };
export declare class Crazyhouse extends Position {
    private constructor();
    reset(): void;
    protected setupUnchecked(setup: Setup): void;
    static default(): Crazyhouse;
    static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<Crazyhouse, PositionError>;
    clone(): Crazyhouse;
    protected validate(opts: FromSetupOpts | undefined): Result<undefined, PositionError>;
    hasInsufficientMaterial(color: Color): boolean;
    dropDests(ctx?: Context): SquareSet;
}
export declare class Atomic extends Position {
    private constructor();
    static default(): Atomic;
    static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<Atomic, PositionError>;
    clone(): Atomic;
    protected validate(opts: FromSetupOpts | undefined): Result<undefined, PositionError>;
    protected validateCheckers(): Result<undefined, PositionError>;
    kingAttackers(square: Square, attacker: Color, occupied: SquareSet): SquareSet;
    protected playCaptureAt(square: Square, captured: Piece): void;
    hasInsufficientMaterial(color: Color): boolean;
    dests(square: Square, ctx?: Context): SquareSet;
    isVariantEnd(): boolean;
    variantOutcome(_ctx?: Context): Outcome | undefined;
}
export declare class Antichess extends Position {
    private constructor();
    reset(): void;
    protected setupUnchecked(setup: Setup): void;
    static default(): Antichess;
    static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<Antichess, PositionError>;
    clone(): Antichess;
    protected validate(_opts: FromSetupOpts | undefined): Result<undefined, PositionError>;
    kingAttackers(_square: Square, _attacker: Color, _occupied: SquareSet): SquareSet;
    ctx(): Context;
    dests(square: Square, ctx?: Context): SquareSet;
    hasInsufficientMaterial(color: Color): boolean;
    isVariantEnd(): boolean;
    variantOutcome(ctx?: Context): Outcome | undefined;
}
export declare class KingOfTheHill extends Position {
    private constructor();
    static default(): KingOfTheHill;
    static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<KingOfTheHill, PositionError>;
    clone(): KingOfTheHill;
    hasInsufficientMaterial(_color: Color): boolean;
    isVariantEnd(): boolean;
    variantOutcome(_ctx?: Context): Outcome | undefined;
}
export declare class ThreeCheck extends Position {
    private constructor();
    reset(): void;
    protected setupUnchecked(setup: Setup): void;
    static default(): ThreeCheck;
    static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<ThreeCheck, PositionError>;
    clone(): ThreeCheck;
    hasInsufficientMaterial(color: Color): boolean;
    isVariantEnd(): boolean;
    variantOutcome(_ctx?: Context): Outcome | undefined;
}
export declare class RacingKings extends Position {
    private constructor();
    reset(): void;
    setupUnchecked(setup: Setup): void;
    static default(): RacingKings;
    static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<RacingKings, PositionError>;
    clone(): RacingKings;
    protected validate(opts: FromSetupOpts | undefined): Result<undefined, PositionError>;
    dests(square: Square, ctx?: Context): SquareSet;
    hasInsufficientMaterial(_color: Color): boolean;
    isVariantEnd(): boolean;
    variantOutcome(ctx?: Context): Outcome | undefined;
}
export declare class Horde extends Position {
    private constructor();
    reset(): void;
    static default(): Horde;
    static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<Horde, PositionError>;
    clone(): Horde;
    protected validate(opts: FromSetupOpts | undefined): Result<undefined, PositionError>;
    hasInsufficientMaterial(color: Color): boolean;
    isVariantEnd(): boolean;
    variantOutcome(_ctx?: Context): Outcome | undefined;
}
export declare const defaultPosition: (rules: Rules) => Position;
export declare const setupPosition: (rules: Rules, setup: Setup, opts?: FromSetupOpts) => Result<Position, PositionError>;
export declare const isStandardMaterial: (pos: Position) => boolean;
