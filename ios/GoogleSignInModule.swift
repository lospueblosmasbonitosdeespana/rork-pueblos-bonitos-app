import Foundation
import GoogleSignIn
import React
import UIKit

@objc(GoogleSignInModule)
class GoogleSignInModule: NSObject {

  @objc
  func signIn(_ resolve: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {

    DispatchQueue.main.async {

      // Localizar el root view controller
      guard
        let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
        let rootVC = scene.windows.first?.rootViewController
      else {
        reject("NO_ROOT", "No root view controller", nil)
        return
      }

      // Configuración correcta
      let config = GIDConfiguration(
        clientID: "1050453988650-cq20qu63m02778k7ihkmghim6n0073og.apps.googleusercontent.com"
      )

      GIDSignIn.sharedInstance.configuration = config

      // Sign-in moderno con presenting:
      GIDSignIn.sharedInstance.signIn(withPresenting: rootVC) { result, error in

        if let error = error {
          reject("GOOGLE_ERROR", error.localizedDescription, error)
          return
        }

        guard let user = result?.user else {
          reject("NO_USER", "Google user is null", nil)
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
}
