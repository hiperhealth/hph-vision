import React from 'react';
import renderer from 'react-test-renderer';
import {VERSION} from '@hiperhealth/hphvision-core';
import App from './App';

describe('App', () => {
  it('renders the core package version', () => {
    const tree = renderer.create(<App />);
    const text = tree.root.findByType('span');

    expect(text.children).toContain(`HPH Vision Core v${VERSION}`);
  });
});
