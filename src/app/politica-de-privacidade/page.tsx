import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Glicose Tech trata seus dados de saúde e quais são os seus direitos.",
};

// MINUTA: os trechos entre colchetes precisam ser preenchidos pelo responsável pelo serviço, e o texto deve ser
// revisado por advogado antes da publicação. Não afirma conformidade com a LGPD.
const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-8 text-xl font-bold">{children}</h2>;

export default function PoliticaPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 text-base leading-relaxed">
      <Link href="/" className="underline underline-offset-4">← Voltar</Link>
      <h1 className="mt-4 text-3xl font-bold">Política de Privacidade</h1>
      <p className="mt-2 text-muted-foreground">Versão 2026-10 · Última atualização: [DATA]</p>
      <p className="mt-4 rounded-2xl border bg-card p-4">
        Esta é uma minuta em revisão. O responsável pelo serviço deve completar os campos entre colchetes e submetê-la a
        revisão jurídica antes de depender dela.
      </p>

      <H>1. O que é o Glicose Tech</H>
      <p>
        O Glicose Tech é um caderno digital para <strong>registrar e acompanhar a glicemia</strong> (e, se você quiser,
        refeições, medicamentos e insulina). Ele organiza os seus registros e gera gráficos e relatórios.
      </p>
      <p className="mt-2">
        <strong>O app não é um serviço médico, não faz diagnóstico, não indica doses ou tratamentos e não substitui o
        acompanhamento com médico, nutricionista ou outro profissional de saúde.</strong> Pelo contrário: ele foi pensado para
        apoiar essa relação. Você pode levar seu relatório em PDF à consulta e, se desejar, compartilhar um link
        temporário com o seu médico ou convidar o profissional para acompanhar seus registros. O assistente de dúvidas é
        apenas educativo. O app não é serviço de emergência: em urgência, procure atendimento de saúde (no Brasil, SAMU 192).
      </p>

      <H>2. Quem é o responsável pelos dados</H>
      <p>
        Controlador: [RAZÃO SOCIAL / NOME], [CNPJ/CPF], [ENDEREÇO]. Contato para assuntos de privacidade (encarregado):
        [E-MAIL DO ENCARREGADO].
      </p>

      <H>3. Quais dados tratamos</H>
      <ul className="mt-2 list-disc pl-6">
        <li><strong>Conta:</strong> nome, e-mail, senha (guardada de forma irreversível) e celular.</li>
        <li><strong>Perfil (opcionais):</strong> data de nascimento, sexo, tipo de diabetes informado por você, ano do diagnóstico, finalidade do acompanhamento e foto.</li>
        <li><strong>Registros de saúde que você cria:</strong> medições de glicose, contexto, observações, refeições, medicamentos e insulina. São dados pessoais sensíveis.</li>
        <li><strong>Segurança e funcionamento:</strong> sessões, endereço IP e navegador (para proteger o login), registros de acesso de familiares, consentimentos e solicitações feitas por você.</li>
      </ul>
      <p className="mt-2">Não vendemos seus dados e não os usamos para publicidade. O assistente não lê seus registros e suas conversas com ele não são guardadas.</p>

      <H>4. Para que usamos</H>
      <ul className="mt-2 list-disc pl-6">
        <li>Prestar o serviço: guardar seus registros, mostrar histórico e gráficos, gerar relatórios.</li>
        <li>Enviar avisos e lembretes que você configurou (por e-mail, sem valores de saúde no texto).</li>
        <li>Proteger contas e prevenir abuso (limite de tentativas, verificação em duas etapas).</li>
        <li>Atender seus pedidos e cumprir obrigações legais.</li>
      </ul>
      <p className="mt-2">Base legal: [DEFINIR COM ASSESSORIA JURÍDICA, ex.: consentimento (art. 7º, I e art. 11, II, &ldquo;a&rdquo; da LGPD) e, quando aplicável, execução de contrato].</p>

      <H>5. Com quem os dados são compartilhados</H>
      <ul className="mt-2 list-disc pl-6">
        <li><strong>Somente com quem você autorizar:</strong> o link temporário do médico (com prazo e revogação). O app não tem convite de familiares ou acompanhantes. Em &ldquo;Quem vê meus dados&rdquo; você vê quem tem acesso, o histórico de mudanças e revogações, e quem acessou.</li>
        <li><strong>Profissionais de saúde</strong> só enxergam seus dados se você (ou o responsável) autorizar. Ter um perfil profissional no app não dá acesso a ninguém.</li>
        <li><strong>Menores de 18 anos:</strong> o uso depende da confirmação de um responsável legal, que passa a acompanhar os registros, somente para leitura. O perfil do menor não é pesquisável nem visível a outros usuários. Ao completar 18 anos, a própria pessoa passa a controlar o perfil e revisa quem continua com acesso.</li>
        <li><strong>Avisos por e-mail</strong> não trazem o valor da glicemia, a menos que você escolha mostrar no Perfil, porque o assunto pode aparecer na tela bloqueada. Avisos podem atrasar ou não chegar: o app não é serviço de emergência.</li>
        <li><strong>Operadores que hospedam e entregam o serviço:</strong> [LISTAR: hospedagem (Vercel), banco de dados (Neon), e-mail (Resend), reCAPTCHA (Google)], sob contrato e apenas para operar o app.</li>
        <li>A administração do app vê contagens e dados de conta, <strong>não suas medições</strong>. Não há perfil público.</li>
      </ul>

      <H>6. Seus direitos</H>
      <p>
        Você pode confirmar o tratamento, acessar, corrigir, exportar uma cópia (em &ldquo;Privacidade e meus dados&rdquo;), revogar
        consentimentos, pedir a exclusão e obter informações sobre compartilhamentos. A exclusão da conta no Perfil apaga seus
        dados do app. Também pode falar com o encarregado em [E-MAIL DO ENCARREGADO] ou reclamar à ANPD.
      </p>

      <H>7. Por quanto tempo guardamos</H>
      <p>
        Enquanto a conta existir. Ao excluí-la, os registros são apagados. [DEFINIR prazos de cópias de segurança e de guarda de
        registros que a lei exija].
      </p>

      <H>8. Segurança</H>
      <p>
        Usamos conexão cifrada, controle de acesso no servidor, limite de tentativas de login, verificação em duas etapas
        opcional (obrigatória para administradores) e registros de auditoria. Nenhum sistema é 100% seguro; em caso de
        incidente relevante, comunicaremos conforme a lei.
      </p>

      <H>9. Alterações</H>
      <p>Mudanças relevantes serão avisadas no app. A versão em vigor é a publicada nesta página.</p>
    </main>
  );
}
