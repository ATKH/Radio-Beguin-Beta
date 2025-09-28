// src/app/politique-confidentialite/page.tsx
import Link from 'next/link';

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 text-pink-500 space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-4xl md:text-5xl font-title font-bold">Politique de confidentialité</h1>
        <p className="text-sm text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Responsable du traitement</h2>
        <p>
          Les données personnelles collectées via <Link href="/" className="underline hover:text-pink-600">radiobeguin.com</Link> sont traitées par l&apos;Association Radio Béguin (SIREN 889&nbsp;114&nbsp;161),
          dont le siège est situé 2B rue Louis Thevenet, 69004 Lyon, France. Vous pouvez contacter le délégué à la protection des données à l&apos;adresse
          <a href="mailto:lebeguin@radiobeguin.com" className="underline"> lebeguin@radiobeguin.com</a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Données collectées</h2>
        <p>Nous collectons uniquement les données nécessaires au bon fonctionnement du site et à la relation avec nos auditeurs :</p>
        <ul className="list-disc list-inside space-y-2 text-sm md:text-base">
          <li>Données transmises via le formulaire de contact (nom, prenom, adresse email, message).</li>
          <li>Données techniques liées à votre navigation (date et heure de visite, pages consultées, adresse IP abrégée, type de navigateur).</li>
          <li>Préférences d&apos;écoute ou de navigation enregistrées via les cookies techniques.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Finalités du traitement</h2>
        <ul className="list-disc list-inside space-y-2 text-sm md:text-base">
          <li>Assurer le fonctionnement du site et la diffusion des programmes (player audio, lecteurs externes).</li>
          <li>Répondre aux messages envoyés via les formulaires et assurer le suivi des demandes.</li>
          <li>Mesurer l&apos;audience du site de manière anonymisée et améliorer l&apos;expérience utilisateur.</li>
          <li>Empêcher la fraude et garantir la sécurité du site.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Base légale</h2>
        <p>
          Les traitements sont fondés sur l&apos;intérêt légitime de Radio Béguin à communiquer sur ses activités, sur votre consentement (formulaire de contact,
          cookies non techniques) ou sur l&apos;exécution d&apos;une relation contractuelle (gestion des dons ou adhésions via des services partenaires comme HelloAsso).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Durée de conservation</h2>
        <p>
          Les données de contact sont conservées le temps nécessaire au traitement de la demande puis archivées pendant 2 ans maximum. Les données techniques
          de navigation sont conservées pendant 13 mois. Les justificatifs administratifs liés aux dons ou adhésions sont conservés selon les délais légaux (10 ans).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Destinataires</h2>
        <p>
          Les données sont exclusivement destinées aux membres habilités de l&apos;Association Radio Béguin et, le cas échéant, à nos prestataires techniques
          (hébergeur, outils d&apos;emailing) situés dans l&apos;Union européenne. Aucun transfert hors UE n&apos;est réalisé sans votre consentement explicite.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Cookies</h2>
        <p>
          Des cookies strictement nécessaires au fonctionnement du site sont déposés (player audio, mémorisation des préférences). Les cookies optionnels
          (mesure d&apos;audience, réseaux sociaux) ne sont utilisés qu&apos;après votre consentement. Vous pouvez configurer votre navigateur pour refuser les cookies
          ou retirer votre consentement à tout moment.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Vos droits</h2>
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition, de portabilité et de définition de directives post-mortem.
          Pour exercer ces droits, adressez un courrier à Association Radio Béguin – 2B rue Louis Thevenet, 69004 Lyon, ou un email à
          <a href="mailto:lebeguin@radiobeguin.com" className="underline"> lebeguin@radiobeguin.com</a>. Une pièce d&apos;identité pourra être demandée afin de confirmer votre identité.
        </p>
        <p>
          Vous pouvez également déposer une réclamation auprès de la CNIL (<a className="underline" href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">cnil.fr</a>).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données (hébergement sécurisé, chiffrement des
          communications, restriction des accès). Malgré tout, aucun système n&apos;étant infaillible, nous vous invitons à nous signaler toute anomalie à
          <a href="mailto:lebeguin@radiobeguin.com" className="underline"> lebeguin@radiobeguin.com</a>. En cas d&apos;incident affectant vos données, vous serez informé dans les meilleurs délais.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Contact</h2>
        <p>
          Pour toute question relative à cette politique de confidentialité ou à vos données personnelles, vous pouvez nous contacter à l&apos;adresse suivante :
        </p>
        <address className="not-italic text-sm md:text-base">
          Association Radio Béguin<br />
          2B rue Louis Thevenet<br />
          69007 Lyon – France<br />
          Email : <a href="mailto:lebeguin@radiobeguin.com" className="underline">lebeguin@radiobeguin.com</a>
        </address>
      </section>
    </main>
  );
}
