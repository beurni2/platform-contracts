# E1 — La transaction traverse tout le circuit. Preuves à l'appui.

**Date : 10 juillet 2026 · Monde épinglé : canon `be1df7a` · sera `77f12bc` · boutik-plus `76ef6aa` · shop-plus `0a8068f`**

Une seule commande — un pagne tissé main à 10 000 FCFA — est partie d'un
fournisseur Boutik+, a trouvé son acheteur par un lien signé Shop+, et a été
livrée par Séra contre le code de retrait. Chaque étape a tourné sur le vrai
code des trois applications, épinglé commit par commit. Rien n'a été simulé
sauf le prestataire de paiement, qui reste un bac à sable certifié.

## Les trois conditions de sortie du Contrat (binaires)

**1. « Les 15 étapes aboutissent, sur UNE seule chaîne de corrélation » — OUI.**
`15-STEP CHAIN COMPLETE — correlation corr_e1live — 31 events`, sortie 0.
Les neuf identifiants sont là, tous distincts :
`quote_e1live → rsv_e1live → payatt_e1live → order_e1live → pkg_e1live →
dtask_e1live → val-order_e1live → sob_supplier_e1live → payout_e1live`.
L'argent tombe juste, au franc près : total acheteur **12 500 FCFA** (retenu par
le prestataire) · fournisseur **8 500 FCFA** · revendeur **2 000 FCFA** · plateforme
**1 000 FCFA** — montants **copiés** du devis, jamais recalculés.
*Preuve : `logs/e1-run.txt` · le devis vérifié en direct par
`assertQuoteReconciles` à l'étape 6.*

**2. « Les premiers mocks passent la suite de certification (§3) » — OUI, et
leurs jumeaux réels aussi.** Quatre paires, côte à côte, 8/8 partout :
projection d'offre (Boutik+ réel), signal « prêt » (Boutik+ réel),
éligibilité au règlement (Séra réel), prestataire de paiement (bac à sable
certifié — seul non-réel, voulu à E1).
*Preuve : `logs/conformance-pairs.txt`.*

**3. « La chaîne est visible sur un tableau de bord simple » — OUI.**
*Preuve : `chain-report.html`, généré par la course elle-même.*

## Ce qui a été prouvé en plus, pendant la course

- **Le coupe-circuit paiement marche, à distance.** Interrupteur engagé →
  le devis est refusé net (`checkout_killed`) → relâché → la course repart.
  Le service de drapeaux est un vrai worker avec stockage durable.
- **Une seule fois, vraiment.** Le code de retrait rejoué n'émet rien de
  neuf ; l'événement d'éligibilité injecté en double est absorbé côté Shop+.
- **La chaîne mord.** Une cassure injectée (validation_id retiré) sur le
  câblage réel → le vérificateur refuse, sortie 1.
- **Réservation atomique des deux côtés**, chacune sous workerd : le stock
  Boutik+ et la réservation Shop+ (objets durables réels).

## Ce qui reste dehors, volontairement

L'isolation des environnements de recette (le dernier reliquat E0) entre à
E2. Les échecs, remboursements et litiges sont le travail d'E2 — ici, un
seul chemin heureux, mais un chemin entier.
