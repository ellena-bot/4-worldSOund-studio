import { useMemo } from 'react';
import { ControlPanel, Door, Inspectable, Terminal } from '@/game/scene/interactables';
import { StoryZone, useDiscovery } from '@/game/scene/storytelling';
import { PortalGate } from '@/game/scene/PortalGate';
import { portalsInWorld } from '@/game/portals';
import { useGameStore } from '@/game/state';
import { Metal, Sign } from './architecture';
import { abyssPalette } from './palette';
import { sectorUnlocked } from './rules';

export function AbyssStory() {
  const p = useMemo(abyssPalette, []); const flags = useGameStore(s => s.flags); const discover = useDiscovery();
  const clearance = sectorUnlocked(flags); const power = flags['abyss-power'] ?? false;
  return <>
    <StoryZone id="abyss-arrival" position={[0, 2, 8]} radius={8} title="Arrival Station" body="The lift has stopped at 2,840 metres. Every crew badge is still hanging by the door." />
    <StoryZone id="abyss-tunnel" position={[0, 2, -24]} radius={12} title="The Glass Tunnel" body="Pressure bends the overhead ribs. Outside, a school turns as one and disappears into the dark." sound={{ kind: 'abyss-call', frequency: 70, gain: 0.04 }} />
    <StoryZone id="abyss-laboratory" position={[0, 2, -57]} radius={8} title="Research Laboratory" body="The equipment is running. The last shift never logged out." />
    <StoryZone id="abyss-observation" position={[0, 2, -81]} radius={10} title="Abyss Observation Deck" body="No seabed. No horizon. The window opens onto water that seems to have no end." />
    <StoryZone id="abyss-restricted" position={[0, 2, -104]} radius={6} title="Restricted Deep-Sea Sector" body="A buckled conduit carries fresh scratch marks. The emergency lamps draw power from an isolated circuit." />
    <Terminal id="abyss-arrival-console" position={[-4, 0, 8]} title="Station manifest" body="NEREID / 14 researchers. Last lift departure: none. Surface communications have been routed to passive listening." prompt="read the station manifest" screenColor={p.signal} onUse={() => discover({ id: 'abyss-manifest', title: 'An empty manifest', body: 'Fourteen researchers. No logged departure.', kind: 'clue' })} />
    {[-6, -3, 3, 6].map((x, i) => <group key={x}><Metal position={[x, 0.75, -57]} size={[2, 1.5, 1.4]} solid dark /><Sign position={[x, 1.7, -57]} size={[1.6, 0.4]} lines={['HYDROPHONE / 0' + (i + 1)]} /></group>)}
    <Terminal id="abyss-research-terminal" position={[-6, 0, -52]} title="Research log / 17" body="The signal repeats every 150 seconds. Not machinery. Not whale song. Director's note: observation staff are granted access to Sector 04. Your badge has been cleared." prompt="read the research log" screenColor={p.signal} onUse={() => { useGameStore.getState().setFlag('abyss-clearance', true); discover({ id: 'abyss-research-log', title: 'Research log / 17', body: 'An unidentified signal repeats every 150 seconds. Sector 04 access granted.', kind: 'clue' }); }} />
    <Inspectable id="abyss-specimen" position={[5, 1.5, -52]} marker={false} title="Specimen 09" body="The container is empty, but its temperature is increasing. The label reads: recovered below the mapped trench floor." prompt="inspect the specimen container" radius={3}>
      <mesh><cylinderGeometry args={[0.65, 0.65, 2.7, 24]} /><meshPhysicalMaterial color={p.glass} transparent opacity={0.2} roughness={0.1} metalness={0.1} /></mesh>
      {[-1.4, 1.4].map(y => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.7, 0.7, 0.18, 24]} /><meshStandardMaterial color={p.metal} metalness={0.7} /></mesh>)}
      <mesh><torusKnotGeometry args={[0.22, 0.035, 48, 6]} /><meshStandardMaterial color={p.life} emissive={p.life} emissiveIntensity={0.35} /></mesh>
    </Inspectable>
    <Inspectable id="abyss-window" position={[11.8, 1.6, -82]} marker={false} title="Observation notes" body="Keep the lamps low. Visitors follow the current past this window, never toward the facility. Something below them does not." prompt="inspect the observation window" radius={3}><Sign position={[0, 0, 0]} size={[1.2, 0.45]} rotationY={-Math.PI / 2} lines={['PASSIVE OBSERVATION', 'NO ACTIVE SONAR']} /></Inspectable>
    <Metal position={[0, 1, -83]} size={[5, 2, 1.2]} solid dark />
    <Terminal id="abyss-hydrophone" position={[-4, 0, -78]} title="Passive hydrophone" body="A broad shadow will cross the starboard window. Beneath the familiar calls, a second pulse answers from the trench." prompt="listen to the hydrophone record" screenColor={p.life} onUse={() => discover({ id: 'abyss-listening', title: 'A second pulse', body: 'Beneath the whale calls, something answers from the trench.', kind: 'clue' })} />
    <Door id="abyss-sector-door" position={[0, 3, -96]} size={[10, 6, 0.35]} color={p.metal} accent={p.alert} slide="up" open={flags['abyss-sector-door'] ?? false} onToggle={v => useGameStore.getState().setFlag('abyss-sector-door', v)} lockedNotice={clearance ? undefined : { title: 'Clearance required', body: 'The research laboratory holds the last access record.' }} promptOpen={clearance ? 'open Sector 04' : 'check Sector 04 clearance'} />
    <Metal position={[0, 7, -96]} size={[10, 2, 0.5]} solid dark />
    <ControlPanel id="abyss-emergency" position={[-3, 1.5, -101]} color={power ? p.life : p.alert} prompt={power ? 'inspect the restored circuit' : 'restore the emergency circuit'} onPress={() => { useGameStore.getState().setFlag('abyss-power', true); discover({ id: 'abyss-emergency-log', title: 'The isolated circuit', body: 'Restoring power releases the archive hatch. Its supply cable continues beneath the floor.', kind: 'clue' }); useGameStore.getState().showNotice('Emergency circuit restored', 'The archive hatch is now supplied with power.'); }} />
    <Metal position={[0, 0.25, -105]} size={[0.6, 0.5, 3]} dark />
    <Metal position={[-3, 1.6, -107]} size={[1.8, 3.2, 1.2]} solid dark />
    <Sign position={[-3, 2, -106.3]} size={[1.5, 0.5]} lines={['PRESSURE / FAULT', 'MANUAL ISOLATION']} />
    <Door id="abyss-archive-door" position={[0, 2.5, -109]} size={[3, 5, 0.35]} color={p.ink} accent={p.life} slide="up" open={flags['abyss-archive-door'] ?? false} onToggle={v => useGameStore.getState().setFlag('abyss-archive-door', v)} lockedNotice={power ? undefined : { title: 'No power', body: 'The emergency control panel is still dark.' }} promptOpen="open the concealed archive" />
    {[-1, 1].map(side => <Metal key={side} position={[side * 3.25, 4, -109]} size={[3.5, 8, 0.4]} solid dark />)}
    <Metal position={[0, 6.5, -109]} size={[3, 3, 0.4]} solid dark />
    <Inspectable id="abyss-unknown-discovery" position={[0, 1.5, -113.5]} radius={3} marker={false} title="Below the last sounding" body="A photograph shows a doorway cut into basalt at 6,900 metres. The stone is dry on its other side. Handwritten beneath it: We did not build this. It was waiting." prompt="inspect the sealed evidence">
      <mesh><octahedronGeometry args={[0.6, 1]} /><meshStandardMaterial color={p.ink} emissive={p.life} emissiveIntensity={0.18} metalness={0.8} roughness={0.25} /></mesh>
      <Sign position={[0, -0.8, 0.15]} size={[2.5, 0.625]} lines={['RECOVERY / 6,900 M', 'WE DID NOT BUILD THIS']} />
    </Inspectable>
    <pointLight position={[0, 3, -113]} color={p.life} intensity={power ? 25 : 6} distance={9} />
    {portalsInWorld('abyss').map(portal => <PortalGate key={portal.id} def={portal} />)}
  </>;
}