import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tabs, TabList, Tab, TabPanel } from '../../components/Tabs.js';

describe('Tabs', () => {
  function TabsFixture() {
    return (
      <Tabs defaultTab="tab1">
        <TabList>
          <Tab id="tab1">Tab One</Tab>
          <Tab id="tab2">Tab Two</Tab>
        </TabList>
        <TabPanel id="tab1">Panel One</TabPanel>
        <TabPanel id="tab2">Panel Two</TabPanel>
      </Tabs>
    );
  }

  it('renders without crashing', () => {
    render(<TabsFixture />);
    expect(screen.getByText('Tab One')).toBeInTheDocument();
    expect(screen.getByText('Tab Two')).toBeInTheDocument();
  });

  it('shows the default tab panel', () => {
    render(<TabsFixture />);
    expect(screen.getByText('Panel One')).toBeInTheDocument();
    expect(screen.queryByText('Panel Two')).not.toBeInTheDocument();
  });

  it('switches panel when a different tab is clicked', () => {
    render(<TabsFixture />);
    fireEvent.click(screen.getByText('Tab Two'));
    expect(screen.queryByText('Panel One')).not.toBeInTheDocument();
    expect(screen.getByText('Panel Two')).toBeInTheDocument();
  });
});
