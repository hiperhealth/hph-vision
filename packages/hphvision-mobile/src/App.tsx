import React from 'react';
import {SafeAreaView, Text} from 'react-native';
import {VERSION} from '@hiperhealth/hphvision-core';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaView>
      <Text>{`HPH Vision Core v${VERSION}`}</Text>
    </SafeAreaView>
  );
}
