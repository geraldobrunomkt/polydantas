import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLogo}>
            <img src="/logo-dantas.png" alt="Dantas 11123" />
          </div>
          <ul className={styles.navLinks}>
            <li><a href="#propostas">Propostas</a></li>
            <li><a href="#historia">História</a></li>
          </ul>
          <a className={styles.navCta} href="#propostas">Conhecer propostas</a>
        </div>
      </nav>

      <header className={styles.hero} id="inicio">
        <div className={styles.heroImageWrap}>
          <img src="/home.png" alt="Poly Dantas 11123 - Deputada Estadual" />
        </div>
      </header>

      <section className={styles.sectionPad} id="propostas">
        <div className={styles.container}>
          <div className={styles.compromissosHead}>
            <span className={styles.kicker}>Plano de governo</span>
            <h2 className={styles.sectionTitle}>
              Meus compromissos com a <span className={styles.accent}>Costa Branca</span>
            </h2>
          </div>
          <div className={styles.commitGrid}>
            <CommitCard
              title="Saúde"
              desc="Mais acesso, estrutura e atendimento de qualidade para nossa gente."
              path="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"
            />
            <CommitCard
              title="Infraestrutura"
              desc="Estradas, mobilidade e saneamento para desenvolver nossa região."
              paths={["M12 3 3 7v1h18V7l-9-4Z", "M5 10v8M9 10v8M15 10v8M19 10v8", "M3 21h18"]}
            />
            <CommitCard
              title="Educação"
              desc="Investimento em escolas, professores e oportunidades para transformar vidas."
              paths={["m2 9 10-5 10 5-10 5-10-5Z", "M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5", "M22 9v6"]}
            />
            <CommitCard
              title="Empreendedorismo"
              desc="Apoio a quem empreende, gera emprego e movimenta a economia local."
              paths={["m3 17 5-6 4 3 5-7 4 5", "M14 6h7v7"]}
            />
            <CommitCard
              title="Assistência Social"
              desc="Políticas públicas que acolhem, protegem e geram dignidade."
              extra={
                <>
                  <circle cx="8" cy="8" r="3" />
                  <circle cx="17" cy="9" r="2.6" />
                  <path d="M2 21c0-3.6 2.7-6 6-6s6 2.4 6 6" />
                  <path d="M14.5 21c.3-2.7 1.8-4.6 4-5.2" />
                </>
              }
            />
            <CommitCard
              title="Meio Ambiente"
              desc="Desenvolvimento com responsabilidade e cuidado com o que é nosso."
              paths={["M5 21c9 0 14-5 14-14 0-.6 0-1.3-.1-2C10 5.5 5 9 5 18c0 1 0 2 0 3Z", "M5 21c2-4 4.5-7 9.5-10.5"]}
            />
          </div>
        </div>
      </section>

      <section className={`${styles.historia} ${styles.sectionPad}`} id="historia">
        <div className={`${styles.container} ${styles.historiaGrid}`}>
          <div className={styles.historiaText}>
            <span className={styles.kicker}>Trajetória</span>
            <h2 className={styles.sectionTitle}>Nossa história inspira e transforma</h2>
            <p>
              Cada passo da minha trajetória me trouxe até aqui. Conheço de perto os
              desafios da nossa gente, porque caminhei ao lado de vocês, ouvindo,
              aprendendo e trabalhando por soluções que realmente fazem a diferença.
            </p>
            <div className={styles.historiaQuote}>
              <span>&ldquo;</span>O mandato que eu quero construir começa na roda de
              conversa, não no gabinete.<span>&rdquo;</span>
            </div>
          </div>
          <div className={styles.historiaFigure}>
            <div className={styles.num}>11123</div>
            <div className={styles.desc}>
              O número que representa cada compromisso com a Costa Branca.
            </div>
            <hr />
            <div className={styles.desc}>Poly Dantas · Progressistas · Deputada Estadual</div>
          </div>
        </div>
      </section>

      <div className={styles.numberStrip}>
        <span className={styles.label}>No dia da votação</span>
        <div className={styles.big}>11123</div>
        <p className={styles.sub}>Poly Dantas · Deputada Estadual · Progressistas</p>
      </div>

      <footer>
        <div className={styles.footLogo}>
          <img src="/logo-dantas.png" alt="Dantas 11123" />
        </div>
        <p className={styles.footRole}>Deputada Estadual · Progressistas</p>
        <p className={styles.footLine}>Rio Grande do Norte · Eleições 2026</p>
        <p className={styles.footLine}>
          <Link className={styles.footPainelLink} href="/painel">Painel da equipe</Link>
        </p>
        <p className={styles.footNote}>Material de propaganda eleitoral. Conteúdo produzido pela campanha.</p>
      </footer>
    </div>
  );
}

function CommitCard({
  title,
  desc,
  path,
  paths,
  extra,
}: {
  title: string;
  desc: string;
  path?: string;
  paths?: string[];
  extra?: React.ReactNode;
}) {
  return (
    <div className={styles.commitCard}>
      <div className={styles.commitIcon}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          {path && <path d={path} />}
          {paths?.map((d) => <path key={d} d={d} />)}
          {extra}
        </svg>
      </div>
      <div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  );
}
