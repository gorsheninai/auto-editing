// Отдельная точка входа только для композиции Story (без старого Reel, которому нужен words.json конкретного ролика)
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {StoryMain, STORY_TOTAL} from './StoryMain';
registerRoot(() => React.createElement(Composition, {id: 'Story', component: StoryMain, durationInFrames: STORY_TOTAL, fps: 30, width: 1080, height: 1920}));
