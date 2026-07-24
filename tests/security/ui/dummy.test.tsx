import React from 'react';
import { render } from '@testing-library/react';

describe('Dummy', () => {
  it('renders', () => {
    render(<div data-testid="dummy">Hello</div>);
  });
});
