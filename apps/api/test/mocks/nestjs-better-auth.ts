/**
 * Test double for `@thallesp/nestjs-better-auth`, which ships as ESM and can't
 * be parsed by ts-jest's CommonJS transform. Only the surface the app's own
 * code imports is stubbed — enough for unit/spec files to load their targets.
 */

export const AllowAnonymous = (): MethodDecorator & ClassDecorator => () => {};

export const Session = (): ParameterDecorator => () => {};

export const AuthGuard = class {
  canActivate() {
    return true;
  }
};

export const AuthModule = {
  forRoot: () => ({ module: class AuthModuleMock {} }),
};
