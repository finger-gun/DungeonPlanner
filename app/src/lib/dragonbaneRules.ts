import type { ActorKind } from '@dungeonplanner/shared/actors'
import type {
  DragonbaneRulesPackDomains,
} from '@dungeonplanner/shared/dragonbane/rulesPack'
import type { RuntimeRulesPackRecord } from './dragonbanePacks'

function mergeByRef<TItem extends { ref: string }>(items: Array<TItem | null | undefined>) {
  return [...new Map(
    items
      .filter((item): item is TItem => Boolean(item?.ref))
      .map((item) => [item.ref, item]),
  ).values()]
}

export function mergeDragonbaneDomains(selectedPacks: RuntimeRulesPackRecord[]): DragonbaneRulesPackDomains | null {
  const domains = selectedPacks
    .map((pack) => pack.domains)
    .filter((domain): domain is DragonbaneRulesPackDomains => Boolean(domain?.dragonbane))

  if (domains.length === 0) {
    return null
  }

  return {
    dragonbane: {
      schemaVersion: 1,
      kins: mergeByRef(domains.flatMap((domain) => domain.dragonbane.kins ?? [])),
      professions: mergeByRef(domains.flatMap((domain) => domain.dragonbane.professions ?? [])),
      skills: mergeByRef(domains.flatMap((domain) => domain.dragonbane.skills ?? [])),
      rules: {
        characterCreation: domains[0].dragonbane.rules.characterCreation,
        appearanceOptions: mergeByRef(domains.flatMap((domain) => domain.dragonbane.rules.appearanceOptions ?? [])),
        mementoOptions: mergeByRef(domains.flatMap((domain) => domain.dragonbane.rules.mementoOptions ?? [])),
        weaknesses: mergeByRef(domains.flatMap((domain) => domain.dragonbane.rules.weaknesses ?? [])),
        heroicAbilities: mergeByRef(domains.flatMap((domain) => domain.dragonbane.rules.heroicAbilities ?? [])),
        magic: {
          rules: domains[0].dragonbane.rules.magic?.rules ?? { schools: [] },
          schools: mergeByRef(domains.flatMap((domain) => domain.dragonbane.rules.magic?.schools ?? [])).map((school) => ({
            ...school,
            cantrips: mergeByRef(
              domains
                .flatMap((domain) => domain.dragonbane.rules.magic?.schools ?? [])
                .filter((candidate) => candidate.ref === school.ref)
                .flatMap((candidate) => candidate.cantrips ?? []),
            ),
            spells: mergeByRef(
              domains
                .flatMap((domain) => domain.dragonbane.rules.magic?.schools ?? [])
                .filter((candidate) => candidate.ref === school.ref)
                .flatMap((candidate) => candidate.spells ?? []),
            ),
          })),
        },
      },
      equipment: {
        weapons: mergeByRef(domains.flatMap((domain) => domain.dragonbane.equipment.weapons ?? [])),
        armor: mergeByRef(domains.flatMap((domain) => domain.dragonbane.equipment.armor ?? [])),
      },
    },
  }
}

export function getAvailableKins(
  domains: DragonbaneRulesPackDomains | null,
  actorKind: ActorKind,
) {
  return domains?.dragonbane.kins.filter((kin) => actorKind === 'npc' || kin.playableByPlayers !== false) ?? []
}

export function getDefaultKinRef(
  domains: DragonbaneRulesPackDomains | null,
  actorKind: ActorKind,
) {
  return getAvailableKins(domains, actorKind)[0]?.ref ?? ''
}

export function getDefaultProfessionRef(domains: DragonbaneRulesPackDomains | null) {
  return domains?.dragonbane.professions[0]?.ref ?? ''
}
