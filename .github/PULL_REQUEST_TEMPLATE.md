## Summary

<!-- Describe the purpose of this change and the main implementation choices. -->

Related issue: <!-- e.g. Closes #123 -->

## Affected packages

- [ ] `packages/mobile` (`@hiperhealth/hphvision`)
- [ ] `packages/mobile-lib` (`@hiperhealth/hphvision-lib`)
- [ ] `packages/api-core` (`hph-vision-core`)
- [ ] `packages/restapi` (`hph-vision-api`)
- [ ] Documentation / plans
- [ ] CI / release / tooling

## How to test

<!-- Check every command that applies, and add any manual verification steps. -->

- [ ] `makim all.lint`
- [ ] `makim all.test`
- [ ] `makim all.typecheck`
- [ ] `makim all.build`
- [ ] `pnpm mobile:android`
- [ ] `pnpm mobile:ios`
- [ ] Manual API/mobile validation described below

Manual validation notes:

```text

```

## Release impact

- [ ] No release needed
- [ ] Patch release
- [ ] Minor release
- [ ] Major release
- [ ] Publishes to PyPI (`hph-vision-core`, `hph-vision-api`)
- [ ] Publishes to npm (`@hiperhealth/hphvision-lib`)

## Safety and privacy

- [ ] No patient data, credentials, tokens, or secrets are included.
- [ ] User-visible medical/health wording was reviewed for safety and clarity.
- [ ] Documentation was updated, or no documentation update is needed.
