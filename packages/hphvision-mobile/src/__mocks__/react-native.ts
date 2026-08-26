import React from 'react';

export const SafeAreaView = ({
  children,
}: {
  children?: React.ReactNode;
}) => React.createElement('div', null, children);

export const Text = ({
  children,
}: {
  children?: React.ReactNode;
}) => React.createElement('span', null, children);
