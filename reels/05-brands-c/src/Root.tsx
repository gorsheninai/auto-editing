import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {TOTAL} from './kit';

export const Root: React.FC = () => (
  <Composition id="Reel" component={Main} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
);
