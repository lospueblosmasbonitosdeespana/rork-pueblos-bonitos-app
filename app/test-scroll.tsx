import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function TestScroll() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <WebView
        source={{
          html: `
            <div style="height:2000px; background:linear-gradient(white,#eee)">
              <h1 style="padding:20px; font-size:24px;">PRUEBA SCROLL</h1>
              <p style="padding:20px;">Desliza hacia abajo. Si esto se mueve, el WebView funciona.</p>
            </div>
          `,
        }}
        style={{ flex: 1 }}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        bounces={true}
        overScrollMode="always"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onScroll={(e) => console.log('📜 SCROLL TEST:', e.nativeEvent.contentOffset?.y)}
      />
    </View>
  );
}
