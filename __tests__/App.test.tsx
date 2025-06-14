/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

describe('App', () => {
  test('renders correctly', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<App />);
    });
    
    expect(component!).toBeDefined();
  });

  test('matches snapshot', async () => {
    let component: ReactTestRenderer.ReactTestRenderer;
    
    await ReactTestRenderer.act(async () => {
      component = ReactTestRenderer.create(<App />);
    });
    
    expect(component!.toJSON()).toMatchSnapshot();
  });
});
