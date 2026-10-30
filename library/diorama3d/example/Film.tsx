import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {WORDS, useFonts} from './kit';
import {Captions} from './v3d/captions';
import {SCENES, END} from './scenes';
import {Board, Title} from './v3d/overlay';
import {wf} from './kit';

export const TOTAL = END; // озвучка после обработки (59,81 с) + 0.5 с

export const Film: React.FC<{only?: number}> = ({only}) => {
  useFonts();
  const list = SCENES.map((s, i) => ({...s, i})).filter((s) => only === undefined || s.i === only);
  return (
    <AbsoluteFill style={{background: '#EFE6D8'}}>
      {list.map(({C, from, dur, i}) => (
        <Sequence key={i} from={only === undefined ? from : 0} durationInFrames={dur}>
          <C from={from} dur={dur} />
        </Sequence>
      ))}
      {only === undefined && <Title end={wf('день')} />}
      {only === undefined && <Board hideAt={wf('прощай')} />}
      <Captions dark={(t) => t > 45.2} />
      {only === undefined && <Audio src={staticFile('mix.wav')} />}
    </AbsoluteFill>
  );
};
void WORDS;
