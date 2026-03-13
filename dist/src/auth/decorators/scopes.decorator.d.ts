export declare const SCOPES_KEY = "scopeConstraints";
export type ScopeTargetEntity = 'AREA' | 'RAMA';
export type ScopeValueSource = 'body' | 'params' | 'query';
export type SupportedScopedType = 'AREA' | 'RAMA';
export interface ScopeConstraint {
    scopeType: SupportedScopedType;
    entity: ScopeTargetEntity;
    field: string;
    source?: ScopeValueSource;
    optional?: boolean;
}
export interface ScopeAwareRequest {
    scopeConstraints?: ScopeConstraint[];
}
export declare const ScopeAccess: <TConstraint extends readonly ScopeConstraint[]>(...constraints: TConstraint) => import("@nestjs/common").CustomDecorator<string>;
export declare const AcceptedScopes: (...dataOrPipes: unknown[]) => ParameterDecorator;
