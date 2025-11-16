import Foundation
import GoogleSignIn
import React

@objc(GoogleSignInModule)
class GoogleSignInModule: NSObject {

  @objc
  func signIn(_ resolve: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard let rootVC = UIApplication.shared.windows.first?.rootViewController else {
        reject("NO_ROOT", "No root view controller", nil)
        return
    }

    let config = GIDConfiguration(
        clientID: "1050453988650-cq20qu63m02778k7ihkmghim6n0073og.apps.googleusercontent.com"
    )

    GIDSignIn.sharedInstance?().signIn
  }
}
