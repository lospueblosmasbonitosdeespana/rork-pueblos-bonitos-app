#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTBridge.h>

@interface RCT_EXTERN_MODULE(GoogleSignInModule, NSObject)

RCT_EXTERN_METHOD(signIn:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
