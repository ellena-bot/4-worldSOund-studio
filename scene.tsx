import { InteractionSystem } from '@/game/scene/InteractionSystem';
import { FacilityShell } from './architecture';
import { OceanAtmosphere } from './effects';
import { MarineLife } from './marine';
import { AbyssStory } from './story';

export function AbyssScene() {
  return <><OceanAtmosphere /><FacilityShell /><MarineLife /><AbyssStory /><InteractionSystem /></>;
}