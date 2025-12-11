import "../style/gdpr.css";

const root = document.querySelector<HTMLDivElement>("#index");
if (!root)
	throw new Error("#index not found");

root.innerHTML = `
	<div class="header">
		<h1 class="title">GDPR Reglementation</h1>
	</div>
	<div class="subtitle">
		  <button class="subtitle" type="button" onclick="window.location.href = '/home';">
			<p>Clique pour retourner au menu!</p>
		</button>
	</div>
	<section class="gdpr">
		<div class="gdpr-block center">
			<h2> 1. Objet du document </h2>
			<p> La présente politique de confidentialité a pour objectif d informer les utilisateurs de l application Pong sur la manière dont leurs données personnelles sont collectées, utilisées et protégées.
			Elle est rédigée en conformité avec le Règlement Général sur la Protection des Données (RGPD) et la loi française « Informatique et Libertés ».
			En utilisant l application, vous reconnaissez avoir pris connaissance de cette politique et l accepter. </p>
		</div>

		<div class="gdpr-block right">
			<h2> 2. Données personnelles collectées </h2>
			<p> Dans le cadre du fonctionnement de l application, les données suivantes peuvent être collectées :
			</br> •	Données de compte : identifiant, pseudonyme, adresse e‑mail, mot de passe (stocké sous forme hachée), date de création du compte.
			</br> •	Données de jeu : historique des parties (adversaires, scores, dates des parties), statistiques de jeu, classement.
			</br> •	Données sociales : liste d amis, demandes d amis envoyées/reçues, blocage éventuel d autres utilisateurs.
			</br> •	Données techniques : adresse IP, identifiants de logs, informations de connexion (date/heure, erreurs serveur), données nécessaires à la sécurité et à la prévention des abus. </p>
		</div>

		<div class="gdpr-block left">
			<h2> 3. Finalités et bases légales des traitements </h2>
			<p> Les données sont traitées pour les finalités suivantes :
			</br> •	Gestion du compte utilisateur, accès au service et fonctionnement du jeu en ligne (acceptation des Conditions Générales d’Utilisation).
			</br> •	Gestion de la liste d’amis, des interactions sociales et de l’historique des parties. Ces traitements reposent également sur l’exécution du contrat et sur notre intérêt légitime à proposer une expérience de jeu cohérente.
			</br> •	Gestion de la liste d’amis, des interactions sociales et de l’historique des parties. Ces traitements reposent également sur l’exécution du contrat et sur notre intérêt légitime à proposer une expérience de jeu cohérente.
			</br> •	Envoi de communications liées au fonctionnement du service (notifications importantes, changements de conditions, informations de sécurité). Ces traitements reposent sur l’exécution du contrat et/ou notre intérêt légitime à informer les utilisateurs. </p>
		</div>

		<div class="gdpr-block right">
			<h2> 4. Durée de conservation des données </h2>
			<p> Les données de compte sont conservées tant que votre compte est actif et que vous utilisez l’application.
			En cas d’inactivité prolongée, le compte et les données associées sont automatiquement supprimés ou anonymisés au‑delà d’une durée de 2 ans sans connexion.
			Les journaux techniques (logs) utilisés pour la sécurité et le débogage peuvent être conservés pour une durée plus courte, puis supprimés ou anonymisés. </p>
		</div>

		<div class="gdpr-block left">
			<h2> 5. Partage des données et sécurité </h2>
			<p> Les données personnelles ne sont pas vendues à des tiers. Elles peuvent être partagées uniquement avec des prestataires techniques strictement nécessaires au fonctionnement de l’application (hébergement, base de données, outils de monitoring), soumis à des obligations de confidentialité.
			Des mesures de sécurité techniques et organisationnelles sont mises en place pour protéger vos données (contrôle des accès, chiffrement des mots de passe, mises à jour régulières du serveur, limitation des droits d’accès).
			Cependant, aucun système informatique n’est totalement infaillible, et un risque résiduel ne peut jamais être exclu. </p>
		</div>

	<div class="gdpr-block right">
		<h2> 6. Vos droits sur vos données </h2>
		<p> Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
		</br> •	Droit d’accès : obtenir une copie des données vous concernant.
		</br> •	Droit de rectification : demander la correction de données inexactes ou incomplètes.
		</br> •	Droit à l’effacement : demander la suppression de votre compte et des données associées, dans la limite des obligations légales.
		</br> •	Droit à la limitation et à l’opposition : contester certains traitements dans les conditions prévues par le RGPD.
		</br> •	Droit à la portabilité : recevoir vos données dans un format structuré lorsque cela est techniquement possible.
		Pour exercer vos droits, vous pouvez contacter : 42pong_angoulême@gmail.fr 
		Vous disposez également du droit d’introduire une réclamation auprès de la CNIL (www.cnil.fr) si vous estimez que vos droits ne sont pas respectés. </p>
	</div>

	<div class="gdpr-block center">
		<h2> 7. Mise à jour de la politique de confidentialité </h2>
		<p> La présente politique de confidentialité peut être mise à jour en cas d’évolution de l’application, des obligations légales ou des traitements de données mis en œuvre.
		En cas de modification importante, les utilisateurs seront informés par un message dans l’application ou par e‑mail, lorsque cela est possible. </p>
	</div>


	</section>
`
