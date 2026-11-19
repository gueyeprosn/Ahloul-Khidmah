# Guide — Notifications push FCM (Flutter Android / iOS / Web) — plan Spark

> Adapté au projet **ahloulkhidmah-mobile** (Flutter 3.50, go_router, Riverpod) et au serveur existant (`POST/DELETE /api/mobile/v1/devices`, table `DeviceToken`, `firebase-admin` déjà installé). Les extraits ci-dessous sont à adapter ; ils n'ont **pas été exécutés** sur un appareil.

## 0. Ce que le plan Spark permet (et ne permet pas)

| Élément | Spark (gratuit) |
|---|---|
| Envoyer / recevoir des notifications FCM | **Oui, sans limite de coût** |
| Cloud Functions pour envoyer | **Non** (exige le plan Blaze) → on envoie depuis **votre serveur** (déjà en place) avec `firebase-admin` |
| Android | Oui |
| iOS | Firebase est gratuit, mais Apple exige un **compte Apple Developer payant** pour la clé APNs ; sans lui, aucune notification sur iPhone réel (le simulateur iOS ne reçoit pas de push) |
| Web | Oui (HTTPS obligatoire, sauf `localhost`) ; sur iPhone, seulement pour une web-app **installée** sur l'écran d'accueil (Safari 16.4+) |

Important : l'ancienne API « legacy » (clé serveur) est supprimée. Utilisez l'API HTTP v1 via un **compte de service** (ce que fait `firebase-admin`).

## 1. Préparation Firebase (console)

1. console.firebase.google.com → créez/ouvrez le projet (plan Spark).
2. Ajoutez les applications : **Android** (`org.ahloulkhidmah.ahloulkhidmah_mobile`), **iOS** (même identifiant de bundle à vérifier dans Xcode), **Web**.
3. **Project settings → Cloud Messaging → Web configuration → Web Push certificates → Generate key pair** : c'est la **clé VAPID publique** (à copier pour le Web).
4. iOS : **Project settings → Cloud Messaging → Apple app configuration → APNs Authentication Key** : téléversez la clé `.p8` (Apple Developer → Keys → cochez « Apple Push Notifications service »).

## 2. Dépendances et configuration

Depuis le dossier `app` (celui qui contient `pubspec.yaml`) :

```bash
flutter pub add firebase_core firebase_messaging
```

```bash
dart pub global activate flutterfire_cli
```

```bash
flutterfire configure
```

`flutterfire configure` (il faut `firebase login` avant, avec la CLI Firebase) génère `lib/firebase_options.dart`, `android/app/google-services.json` et `ios/Runner/GoogleService-Info.plist`. Ces fichiers ne sont **pas des secrets**, mais ne commitez jamais de compte de service.

Si le projet n'a pas de dossier `web/` : `flutter create . --platforms=web` (il ajoute `web/` sans toucher au reste).

### Android
- `android/app/src/main/AndroidManifest.xml`, avant `<application>` (Android 13+ exige l'autorisation à l'exécution) :
  ```xml
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
  ```
- `minSdk` ≥ 23 dans `android/app/build.gradle.kts`.

### iOS (sur Mac, dans Xcode)
- Ouvrez `ios/Runner.xcworkspace` → target **Runner → Signing & Capabilities** → **+ Capability** : **Push Notifications** et **Background Modes → Remote notifications**.
- `flutter run` sur **iPhone réel** (le simulateur ne reçoit pas de push).

## 3. Code Flutter — `lib/push/push_service.dart`

```dart
import 'dart:async';
import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../firebase_options.dart';

/// Clé VAPID PUBLIQUE (Web uniquement) — console Firebase → Cloud Messaging.
/// Elle est publique par conception : ce n'est pas un secret.
const String kVapidKey = 'COLLER_ICI_LA_CLE_VAPID_PUBLIQUE';

/// Gestionnaire des messages reçus APPLICATION FERMÉE ou EN ARRIÈRE-PLAN.
/// Contraintes : fonction de premier niveau (pas une méthode), annotée
/// `vm:entry-point`, exécutée dans un isolate séparé → il faut ré-initialiser
/// Firebase. Ne PAS l'enregistrer sur le Web (c'est le service worker qui s'en charge).
///
/// Rappel : un message contenant un bloc `notification` est affiché par le
/// système tout seul en arrière-plan ; ce gestionnaire sert surtout aux
/// messages « data-only » (mise à jour silencieuse, compteur…).
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  debugPrint('[push] arrière-plan : ${message.messageId} data=${message.data}');
}

/// Service unique de notifications. À créer une fois (ex. via un provider Riverpod).
class PushService {
  PushService({required this.registerToken, required this.unregisterToken});

  /// Envoie le jeton à VOTRE serveur (POST /api/mobile/v1/devices).
  final Future<void> Function(String token) registerToken;

  /// Supprime le jeton côté serveur (DELETE /api/mobile/v1/devices).
  final Future<void> Function(String token) unregisterToken;

  final _messaging = FirebaseMessaging.instance;
  StreamSubscription<String>? _refreshSub;
  StreamSubscription<RemoteMessage>? _foregroundSub;
  String? _token;

  /// Messages reçus pendant que l'application est ouverte (pour afficher une
  /// bannière interne : Android n'affiche PAS de notification système au premier plan).
  final _foregroundController = StreamController<RemoteMessage>.broadcast();
  Stream<RemoteMessage> get foregroundMessages => _foregroundController.stream;

  /// À appeler une fois, après `Firebase.initializeApp` (voir main.dart).
  Future<void> init() async {
    // 1) Autorisation. Android 13+ et iOS affichent une boîte de dialogue ;
    //    Android < 13 accorde d'office. N'appelez pas ceci à froid au lancement :
    //    mieux vaut l'appeler après une explication à l'écran (taux d'acceptation).
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false, // true = iOS « discret », sans demande
    );
    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('[push] notifications refusées par l’utilisateur');
      return;
    }

    // 2) iOS : afficher aussi les notifications quand l'app est au premier plan.
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    // 3) Jeton FCM.
    await _fetchAndRegisterToken();

    // 4) Le jeton change (réinstallation, restauration, expiration) : toujours écouter.
    _refreshSub = _messaging.onTokenRefresh.listen((t) async {
      _token = t;
      await registerToken(t);
    });

    // 5) Premier plan.
    _foregroundSub = FirebaseMessaging.onMessage.listen((message) {
      debugPrint('[push] premier plan : ${message.notification?.title}');
      _foregroundController.add(message);
    });
  }

  Future<void> _fetchAndRegisterToken() async {
    try {
      // iOS : le jeton APNs doit exister avant le jeton FCM (absent sur simulateur).
      if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) {
        var apns = await _messaging.getAPNSToken();
        for (var i = 0; apns == null && i < 10; i++) {
          await Future<void>.delayed(const Duration(milliseconds: 500));
          apns = await _messaging.getAPNSToken();
        }
        if (apns == null) {
          debugPrint('[push] pas de jeton APNs (simulateur ou clé APNs manquante)');
          return;
        }
      }

      // Web : la clé VAPID publique est OBLIGATOIRE. Ignorée sur Android/iOS.
      final token = await _messaging.getToken(vapidKey: kIsWeb ? kVapidKey : null);
      if (token == null) return;
      _token = token;
      await registerToken(token);
    } catch (e) {
      // Ne jamais bloquer l'application pour une notification.
      debugPrint('[push] jeton indisponible : $e');
    }
  }

  /// À appeler à la déconnexion : le jeton ne doit plus pointer vers le compte.
  Future<void> onLogout() async {
    final t = _token;
    if (t != null) await unregisterToken(t);
    await _messaging.deleteToken();
    _token = null;
  }

  Future<void> dispose() async {
    await _refreshSub?.cancel();
    await _foregroundSub?.cancel();
    await _foregroundController.close();
  }
}
```

### Brancher sur le serveur existant

Le serveur accepte `{ token, platform: "android"|"ios", locale?, appVersion? }` et rattache le jeton au membre si une session est ouverte. Exemple avec le client Dio du projet (adaptez le nom de la classe) :

```dart
Future<void> registerDeviceToken(ApiClient api, String token, String locale) =>
    api.dio.post('/devices', data: {
      'token': token,
      'platform': defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android',
      'locale': locale,
      'appVersion': '1.0.0',
    });
```

À faire : **ré-enregistrer le jeton après la connexion** (pour qu'il soit rattaché au membre) et appeler `onLogout()` à la déconnexion.
**Web** : la route serveur refuse `platform: "web"` (`z.enum(["android","ios"])`). Si vous voulez le Web, il faut ajouter `"web"` à ce schéma (et à la table) côté serveur.

## 4. `lib/main.dart`

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

import 'firebase_options.dart';
import 'push/push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialise Firebase avec la configuration générée par `flutterfire configure`
  // (choisit automatiquement Android / iOS / Web).
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Messages reçus application fermée / en arrière-plan.
  // À enregistrer AVANT runApp, jamais sur le Web (service worker).
  if (!kIsWeb) {
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  }

  runApp(const MyApp()); // votre application existante (Riverpod, go_router…)
}
```

Créez le `PushService` dans un provider Riverpod, puis appelez `push.init()` **après** l'écran d'explication « Activer les notifications ? », pas dans `main()`.

## 5. Web

### 5.1 Clé VAPID
Collez la clé publique dans `kVapidKey` (voir plus haut). C'est la seule clé nécessaire côté client.

### 5.2 Service worker — `web/firebase-messaging-sw.js`
Le fichier doit être **à la racine du site** (`/firebase-messaging-sw.js`) ; le plugin l'enregistre tout seul. Les valeurs `firebaseConfig` sont celles de `firebase_options.dart` (section web) ; elles sont publiques.

```js
// Service worker FCM — reçoit les notifications quand l'onglet est fermé ou en arrière-plan.
// Le SDK « compat » est exigé dans un service worker (pas de modules ES ici).
// Vérifiez la version la plus récente dans la doc Firebase avant mise en production.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Même configuration que l'application web (valeurs publiques).
firebase.initializeApp({
  apiKey: "...",
  authDomain: "...firebaseapp.com",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
});

const messaging = firebase.messaging();

// Messages « data-only » : on affiche nous-mêmes la notification.
// Si le message contient déjà un bloc `notification`, le SDK l'affiche tout seul :
// en ajouter une ici créerait un DOUBLON.
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;

  const data = payload.data || {};
  self.registration.showNotification(data.title || "Ahloul Khidmah", {
    body: data.body || "",
    icon: "/icons/Icon-192.png",
    data: { route: data.route || "/" },
  });
});

// Clic sur la notification : ouvre/réutilise l'onglet de l'application.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // N'accepte qu'un chemin interne (pas d'URL externe).
  const raw = (event.notification.data && event.notification.data.route) || "/";
  const route = typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) { c.navigate(route); return c.focus(); }
      }
      return clients.openWindow(route);
    })
  );
});
```

Tester le Web : `flutter run -d chrome --web-port 5000` (localhost est autorisé sans HTTPS), accepter la permission, copier le jeton affiché dans la console. En production : HTTPS obligatoire.

## 6. Gestion du clic — `lib/push/push_interaction_handler.dart`

Trois situations à couvrir : application **fermée** (`getInitialMessage`), en **arrière-plan** (`onMessageOpenedApp`), au **premier plan** (déjà géré par `onMessage`).

```dart
import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

/// Enveloppe l'application : réagit au tap sur une notification.
/// Placez-le sous le MaterialApp.router (il a besoin du contexte du routeur).
class PushInteractionHandler extends StatefulWidget {
  const PushInteractionHandler({super.key, required this.child});
  final Widget child;

  @override
  State<PushInteractionHandler> createState() => _PushInteractionHandlerState();
}

class _PushInteractionHandlerState extends State<PushInteractionHandler> {
  StreamSubscription<RemoteMessage>? _openedSub;

  @override
  void initState() {
    super.initState();
    _setup();
  }

  Future<void> _setup() async {
    // 1) Application FERMÉE puis ouverte par un tap : le message est consommé UNE fois.
    final initial = await FirebaseMessaging.instance.getInitialMessage();
    if (initial != null) _open(initial);

    // 2) Application EN ARRIÈRE-PLAN ramenée au premier plan par un tap.
    _openedSub = FirebaseMessaging.onMessageOpenedApp.listen(_open);
  }

  void _open(RemoteMessage message) {
    if (!mounted) return;
    final route = message.data['route'];

    // Sécurité : une notification est une entrée non fiable. On n'accepte
    // qu'un chemin interne connu — jamais d'URL arbitraire.
    if (route is String && _isAllowedRoute(route)) {
      // Attendre la fin de la frame : le routeur n'est pas prêt au tout premier build.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) GoRouter.of(context).go(route);
      });
    }
  }

  static const _allowed = ['/', '/cotisations', '/compte'];
  bool _isAllowedRoute(String r) => _allowed.contains(r);

  @override
  void dispose() {
    _openedSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
```

Adaptez `_allowed` aux routes réelles de `lib/app/` (le projet a déjà un routeur go_router).

## 7. Envoyer une notification (côté serveur, Spark compatible)

Pas de Cloud Functions : l'envoi se fait depuis votre serveur Next.js, qui a déjà `firebase-admin` et `FIREBASE_SERVICE_ACCOUNT_PATH`. Principe :

```ts
import { getMessaging } from "firebase-admin/messaging"
// L'app admin est déjà initialisée dans le projet (compte de service).

const tokens = (await prisma.deviceToken.findMany({ select: { token: true } })).map(t => t.token)

// Max 500 jetons par appel.
const res = await getMessaging().sendEachForMulticast({
  tokens,
  notification: { title: "Cotisation", body: "Votre cotisation de novembre est due." },
  data: { route: "/cotisations" }, // lu par PushInteractionHandler (valeurs = chaînes uniquement)
  android: { priority: "high" },
})

// Nettoyer les jetons morts pour ne pas les réutiliser.
res.responses.forEach((r, i) => {
  if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
    void prisma.deviceToken.deleteMany({ where: { token: tokens[i] } })
  }
})
```

À faire côté produit : n'envoyer que ce que le membre a accepté, éviter les rafales, et ne jamais mettre de données personnelles sensibles (montants, noms) dans le texte : il s'affiche sur l'écran verrouillé.

## 8. Tester dans l'ordre

1. **Android** (émulateur avec Google Play) : `flutter run`, accepter la permission, relever le jeton dans les logs.
2. Console Firebase → **Messaging → Create your first campaign → Send test message** → collez le jeton : testez application **ouverte**, **en arrière-plan**, **fermée**, puis le **tap** (la route doit s'ouvrir).
3. Vérifier côté serveur qu'une ligne `DeviceToken` est créée, puis rattachée au membre après connexion.
4. iOS : iPhone réel + clé APNs. Web : `localhost` puis HTTPS.

## 9. Pièges fréquents

- **Rien ne s'affiche au premier plan sur Android** : normal, utilisez `foregroundMessages` (bannière interne) ou ajoutez `flutter_local_notifications`.
- **`getToken` renvoie null / erreur sur iOS** : push non activée dans Xcode, clé APNs absente, ou simulateur.
- **Doublon sur le Web** : le service worker affiche une notification alors que le message contient déjà `notification` (voir le test `if (payload.notification) return`).
- **Le handler d'arrière-plan ne s'exécute pas** : il n'est pas de premier niveau, il manque `@pragma('vm:entry-point')`, ou il est enregistré après `runApp`.
- **Web : permission refusée** : le navigateur ne la redemande jamais ; il faut que l'utilisateur la rétablisse dans les réglages du site.
- **Jetons obsolètes** : supprimez-les à l'erreur `registration-token-not-registered` (voir §7).
