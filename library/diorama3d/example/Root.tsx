import React from 'react';
import {Composition, Still} from 'remotion';
import {Film, TOTAL} from './Film';
import {CityTop, Poses} from './Debug';
import {SCENES} from './scenes';

export const Root: React.FC = () => (
  <>
    <Composition id="Reel" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    {SCENES.map((s, i) => (
      <Composition key={i} id={`Scene${i}`} component={Film} defaultProps={{only: i}} durationInFrames={s.dur} fps={30} width={1080} height={1920} />
    ))}
    <Still id="Poses" component={Poses} width={1080} height={1920} />
    <Still id="CityTop" component={CityTop} width={1080} height={1920} />
  </>
);
