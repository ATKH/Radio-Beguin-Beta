// src/app/mentions-legales/page.tsx
import Link from 'next/link';

export default function MentionsLegalesPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 text-foreground space-y-10">
      <header className="space-y-3 text-center">
      <h1 className="text-4xl md:text-5xl font-serif font-bold">Mentions légales</h1>
        <p className="text-sm text-muted-foreground">
          Conformément à la loi n°2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">1. Présentation du site</h2>
        <p>
          Le site <Link href="/" className="underline hover:text-primary">radiobeguin.com</Link> est édité par l&apos;Association Radio Béguin,
          association loi 1901 déclarée, dont le siège social est situé au 2B rue Louis Thevenet, 69004 Lyon, France.
        </p>
        <ul className="space-y-1 text-sm md:text-base">
          <li><strong>Raison sociale :</strong> Association Radio Béguin</li>
          <li><strong>SIREN :</strong> 889&nbsp;114&nbsp;161</li>
          <li><strong>Responsable de la publication :</strong> Bureau de l&apos;association Radio Béguin – <a className="underline hover:text-primary" href="mailto:lebeguin@radiobeguin.com">lebeguin@radiobeguin.com</a></li>
          <li><strong>Hébergeur :</strong> OVHcloud – 2 rue Kellermann, 59100 Roubaix, France – <a className="underline hover:text-primary" href="https://www.ovhcloud.com/fr/" target="_blank" rel="noopener noreferrer">ovhcloud.com</a> – 1007</li>
          <li><strong>Contact :</strong> <a className="underline hover:text-primary" href="mailto:lebeguin@radiobeguin.com">lebeguin@radiobeguin.com</a></li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">2. Conditions d&apos;utilisation</h2>
        <p>
          L&apos;utilisation du site implique l&apos;acceptation pleine et entière des présentes conditions générales d&apos;utilisation.
          Elles peuvent être modifiées à tout moment ; les utilisateurs sont invités à les consulter régulièrement. Le site
          est normalement accessible 24&nbsp;h/24. Radio Béguin peut toutefois décider d&apos;une interruption pour maintenance et
          s&apos;efforcera de communiquer préalablement les dates et heures d&apos;intervention.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">3. Description des services</h2>
        <p>
          Le site radiobeguin.com a pour objet de présenter l&apos;actualité de Radio Béguin, sa grille de programmes, ses
          émissions et ses contenus audio. Les informations publiées sont indicatives et susceptibles d&apos;évoluer. Radio Béguin
          ne saurait être tenue responsable des omissions ou inexactitudes, qu&apos;elles soient de son fait ou du fait de partenaires.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">4. Limitations techniques</h2>
        <p>
          Le site utilise notamment les technologies JavaScript et les lecteurs audio HTML5. L&apos;utilisateur s&apos;engage à accéder au
          site avec un équipement récent, exempt de virus et muni d&apos;un navigateur à jour. L&apos;hébergeur met tout en œuvre pour
          assurer un taux de disponibilité optimal mais peut procéder à des interruptions pour maintenance ou amélioration de
          ses infrastructures.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">5. Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des éléments présents sur le site (textes, graphismes, logos, sons, vidéos, …) est protégé par le Code de la
          Propriété Intellectuelle. Toute reproduction ou représentation, même partielle, sans autorisation écrite préalable est interdite
          et constitue une contrefaçon susceptible d&apos;engager la responsabilité de l&apos;utilisateur (articles L.335-2 et suivants du CPI).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">6. Limitations de responsabilité</h2>
        <p>
          Radio Béguin ne pourra être tenue responsable des dommages matériels liés à l&apos;utilisation du site, ni des dommages
          indirects tels qu&apos;une perte de marché ou une perte de chance. Des espaces interactifs (formulaire de contact, etc.)
          peuvent être mis à disposition ; tout contenu illicite peut être supprimé sans préavis. En cas de message à caractère
          injurieux, diffamatoire ou raciste, l&apos;association se réserve le droit d&apos;engager la responsabilité civile et/ou pénale de l&apos;utilisateur.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">7. Données personnelles</h2>
        <p>
          Radio Béguin respecte le Règlement Général sur la Protection des Données (RGPD n°2016-679) et la loi Informatique et Libertés.
          Les informations collectées via le site sont utilisées pour répondre aux demandes des utilisateurs, assurer la diffusion des programmes,
          réaliser des statistiques anonymisées et améliorer l&apos;expérience de navigation. Les données sont conservées pendant la durée nécessaire
          aux finalités poursuivies et ne sont jamais vendues.
        </p>
        <p>
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;opposition, de limitation, de portabilité et d&apos;effacement
          de vos données. Pour exercer ces droits, adressez votre demande écrite à : Association Radio Béguin – DPO, 2B rue Louis Thevenet,69004 Lyon,
          , ou par email à <a className="underline" href="mailto:lebeguin@radiobeguin.com">lebeguin@radiobeguin.com</a>. Une réponse vous sera apportée dans un délai raisonnable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">8. Cookies</h2>
        <p>
          Le site peut déposer des cookies techniques nécessaires à son fonctionnement (lecture audio, préférences d&apos;affichage).
          Vous pouvez configurer votre navigateur pour accepter ou refuser ces cookies. Le refus peut limiter certaines fonctionnalités.
          Radio Béguin peut également utiliser des cookies de mesure d&apos;audience ou issus de partenaires tiers (réseaux sociaux) après votre accord.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">9. Liens hypertextes</h2>
        <p>
          Le site peut contenir des liens vers des sites externes. Radio Béguin ne disposant d&apos;aucun contrôle sur ces contenus, elle ne peut
          être tenue responsable des informations, services ou éventuels dommages résultant de la consultation de ces sites tiers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">10. Droit applicable</h2>
        <p>
          Les présentes mentions légales sont soumises au droit français. En cas de litige et à défaut de résolution amiable, la compétence
          est attribuée aux tribunaux de Lyon, sous réserve des dispositions légales impératives.
        </p>
      </section>
    </main>
  );
}
