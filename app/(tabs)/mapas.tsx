import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLanguage } from '@/contexts/language';

export default function Mapas() {
  const { language } = useLanguage();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
      <title>Mapa Boldest</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        #bWidgetMap {
          width: 100%;
          height: 100%;
        }
      </style>
    </head>
    <body>
      <div
        id="bWidgetMap"
        integration="full"
        topHeight="40"
        showCurtain="true"
        showButtons="false"
        parenturiprefix="bwidget:"
        ignoreBottomContent="true"
        embedurl="https://maps.lospueblosmasbonitosdeespana.org"
        embedmainuri="/${language}/app"
        mapScrollwheel="true"
      ></div>
      <script type="text/javascript" src="https://maps.lospueblosmasbonitosdeespana.org/embed.js"></script>
    </body>
    </html>
  `;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <WebView
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        incognito={false}
        cacheEnabled={true}
        allowsInlineMediaPlayback
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        startInLoadingState
        scalesPageToFit={true}
        bounces={false}
        scrollEnabled={true}
      />
    </View>
  );
}
