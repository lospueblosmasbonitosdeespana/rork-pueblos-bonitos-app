import Foundation
import GoogleSignIn
import React

@objc(GoogleSignInModule)
class GoogleSignInModule: NSObject {

  @objc
  func signIn(_ resolve: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
          let rootVC = scene.windows.first?.rootViewController else {
        reject("NO_ROOT", "No root view controller", nil)
        return
    }

    let configuration = GIDConfiguration(
      clientID: "1050453988650-cq20qu63m02778k7ihkmghim6n0073og.apps.googleusercontent.com"
    )

    GIDSignIn.sharedInstance.signIn(
      withPresenting: rootVC,
      hint: nil,
      additionalScopes: [],
      configuration: configuration
    ) { result, error in

      if let error = error {
        reject("GOOGLE_ERROR", error.localizedDescription, error)
        return
      }

      guard let user = result?.user else {
        reject("NO_USER", "El usuario es nulo", nil)
        return
      }

      let idToken = user.idToken?.tokenString ?? ""
      let accessToken = user.accessToken.tokenString

      resolve([
        "idToken": idToken,
        "accessToken": accessToken,
        "email": user.profile?.email ?? "",
        "name": user.profile?.name ?? ""
      ])
    }
  }
}
