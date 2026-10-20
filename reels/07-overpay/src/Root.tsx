import React from 'react';
import {Composition} from 'remotion';
import {StoryMain, STORY_TOTAL} from './story/StoryMain';

export const Root: React.FC = () => (
  <Composition id="Story" component={StoryMain} durationInFrames={STORY_TOTAL} fps={30} width={1080} height={1920} />
);
