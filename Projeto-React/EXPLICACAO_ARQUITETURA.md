# Explicacao do Projeto e Arquitetura

## Visao Geral

O **TaskFlow** e uma aplicacao web feita com **React**, **TypeScript** e **Vite**. O objetivo do sistema e permitir que usuarios criem contas, facam login, gerenciem tarefas, acompanhem prazos em calendario, visualizem graficos de produtividade e tenham algumas metricas de seguranca.

O projeto funciona inteiramente no frontend. Nao existe backend, banco de dados externo ou API propria. Por isso, os dados sao persistidos no navegador usando `localStorage`, e a sessao do usuario logado e simulada com `cookies`.

As principais funcionalidades atuais sao:

- Login, cadastro e recuperacao simulada de senha.
- Sessao persistente por cookie.
- Criacao, edicao, conclusao e exclusao de tarefas.
- Tarefas com prioridade, categoria, descricao, prazo, status e subtarefas.
- Busca, filtros e ordenacao de tarefas.
- Calendario mensal com navegacao entre meses.
- Atalho para ir diretamente ao mes em que ha tarefas marcadas.
- Pagina de graficos com distribuicao por status, categoria e prioridade.
- Edicao de perfil do usuario.
- Painel administrativo.
- Historico de eventos de seguranca.
- Bloqueio temporario apos tentativas falhas de login.
- Medidor de forca da senha.
- Indicador de sessao ativa.
- Criptografia local de campos sensiveis salvos no `localStorage`.
- Tema claro e escuro.

## Tecnologias Utilizadas

O projeto utiliza:

- **React**: construcao da interface.
- **TypeScript**: tipagem dos dados, props e funcoes.
- **Vite**: ambiente de desenvolvimento e build.
- **Context API**: controle global de autenticacao.
- **localStorage**: persistencia local de usuarios, tarefas, tema e eventos de seguranca.
- **Cookies**: persistencia da sessao do usuario logado.
- **CSS global**: layout, responsividade, tema claro/escuro e animacoes.

Apesar de existir dependencia de `react-router-dom`, o projeto nao usa rotas reais. A navegacao entre telas e feita por estado interno com o tipo `AppView`.

## Estrutura Principal

```txt
src/
  App.tsx
  main.tsx
  constants.ts
  index.css
  security.ts
  secureStorage.ts

  components/
    AdminPanel.tsx
    AuthShell.tsx
    CalendarPage.tsx
    ChartsPage.tsx
    Dashboard.tsx
    ForgotPassword.tsx
    Login.tsx
    PasswordField.tsx
    PasswordStrengthMeter.tsx
    Register.tsx
    Settings.tsx
    ThemeToggle.tsx
    UserBadge.tsx
    Workspace.tsx

  context/
    AuthContext.tsx

  hooks/
    useLocalStorage.ts

  types/
    index.ts
```

As responsabilidades principais sao:

- `components`: telas e componentes visuais.
- `context`: estado global de autenticacao.
- `hooks`: logicas reutilizaveis.
- `types`: modelos TypeScript do sistema.
- `security.ts`: metricas e eventos de seguranca.
- `secureStorage.ts`: criptografia e descriptografia local.
- `index.css`: estilos gerais, tema e responsividade.

## Entrada da Aplicacao

O arquivo `main.tsx` e o ponto inicial do projeto. Ele cria a raiz React e envolve o `App` com o `AuthProvider`.

```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

Isso permite que todos os componentes internos acessem dados de autenticacao por meio do hook `useAuth`.

## Componente App

O `App.tsx` decide se o usuario vera a area publica ou a area interna.

Ele usa:

```tsx
const { currentUser } = useAuth()
```

Se `currentUser` existir, o app exibe `Workspace`. Se nao existir, exibe `AuthShell`.

O `App` tambem controla:

- a tela atual com `view`;
- o tema escuro com `useLocalStorage`;
- a navegacao interna por meio da funcao `goTo`.

As telas internas atuais incluem:

- `dashboard`
- `calendar`
- `charts`
- `settings`
- `admin`

## Tipos do Sistema

Os modelos principais ficam em `src/types/index.ts`.

O tipo `User` representa uma conta:

```ts
export interface User {
  id: string
  username: string
  email: string
  password: string
  avatar?: string
  passwordUpdatedAt?: string
}
```

O tipo `Task` representa uma tarefa:

```ts
export interface Task {
  id: string
  userId: string
  title: string
  completed: boolean
  status?: TaskStatus
  priority?: TaskPriority
  category?: string
  description?: string
  subtasks?: Subtask[]
  dueDate?: string
  createdAt: string
}
```

As tarefas se relacionam com usuarios pelo campo `userId`.

Tambem existem tipos para:

- `TaskStatus`: pendente, em andamento ou concluida.
- `TaskPriority`: baixa, media ou alta.
- `Subtask`: subtarefas dentro de uma tarefa.
- `SecurityEvent`: eventos de seguranca.
- `PasswordStrength`: resultado da avaliacao da senha.
- `LoginResult`: retorno detalhado do login.

## AuthContext

O `AuthContext.tsx` e o centro da autenticacao.

Ele guarda e disponibiliza:

- `currentUser`: usuario logado.
- `users`: usuarios cadastrados.
- `securityEvents`: historico de eventos de seguranca.
- `sessionStartedAt`: horario de inicio da sessao.
- `login`: autentica o usuario.
- `logout`: encerra a sessao.
- `register`: cadastra usuario.
- `updateUser`: atualiza o usuario logado.
- `updateAnyUser`: atualiza qualquer usuario pelo admin.
- `deleteUser`: remove usuarios comuns.

O usuario administrador inicial e:

```ts
{
  id: '1',
  username: 'Admin',
  email: 'admin@sla.com',
  password: '123456',
  avatar: '',
}
```

O sistema identifica o admin pelo `id === '1'`.

## Persistencia e Criptografia Local

Os usuarios sao salvos em:

```txt
taskflow_users
```

Antes, os campos ficavam em texto puro. Agora, os campos sensiveis sao criptografados pelo arquivo `secureStorage.ts`.

Campos criptografados:

- `username`
- `email`
- `password`
- `avatar`

O app usa os dados descriptografados apenas em memoria, mas grava no `localStorage` valores com prefixo:

```txt
tfenc:
```

O `secureStorage.ts` possui funcoes como:

- `encryptValue`
- `decryptValue`
- `serializeUsers`
- `parseUsers`
- `serializeSecurityEvents`
- `parseSecurityEvents`

Tambem existe uma migracao simples: quando o app carrega usuarios antigos em texto puro, ele passa a regravar os dados no formato criptografado.

Importante: como o projeto e 100% frontend, a chave de criptografia fica no codigo. Portanto, essa medida protege contra leitura casual do `localStorage`, mas nao substitui seguranca real de backend.

## Sessao com Cookie

A sessao e simulada com o cookie:

```txt
taskflow_session
```

O cookie guarda:

- `id` do usuario;
- `email`;
- `startedAt`, indicando quando a sessao iniciou.

Quando o app recarrega, o `AuthProvider` le o cookie e tenta encontrar o usuario correspondente no `localStorage`. Se encontrar, a sessao continua ativa.

Ao fazer logout, o cookie e apagado.

## Fluxo de Login

O componente `Login.tsx` envia e-mail e senha para:

```ts
login(email.trim(), password)
```

O login retorna um `LoginResult`, com sucesso, mensagem de erro, quantidade de tentativas falhas e possivel tempo de bloqueio.

O fluxo e:

```txt
Login.tsx
  chama login()
    AuthContext verifica bloqueio
      valida e-mail e senha
        salva cookie
        registra evento de seguranca
        atualiza currentUser
```

Se o login falhar, o sistema registra o evento e incrementa as tentativas daquele e-mail.

## Tentativas Falhas e Bloqueio Temporario

O arquivo `security.ts` controla as tentativas de login.

Os dados sao salvos em:

```txt
taskflow_login_attempts
```

Depois de 5 tentativas incorretas, o login daquele e-mail fica bloqueado por 30 segundos.

Eventos relacionados:

- `login_failed`
- `login_blocked`
- `login_success`

Quando o login e bem-sucedido, as falhas anteriores daquele e-mail sao limpas.

## Eventos de Seguranca

O historico de seguranca fica em:

```txt
taskflow_security_events
```

Os eventos registrados incluem:

- login realizado;
- login falhou;
- login bloqueado;
- logout;
- cadastro;
- senha alterada;
- perfil atualizado;
- usuario deletado.

O e-mail salvo no evento tambem e criptografado no `localStorage`.

No painel administrativo, os ultimos eventos aparecem em uma tabela visual.

## Forca da Senha

O projeto possui o componente `PasswordStrengthMeter.tsx`.

Ele usa `evaluatePasswordStrength`, de `security.ts`, para classificar a senha como:

- fraca;
- media;
- forte.

Os criterios avaliados sao:

- tamanho minimo de 8 caracteres;
- letra minuscula;
- letra maiuscula;
- numero;
- simbolo.

No cadastro, senhas fracas sao bloqueadas. Em configuracoes, o usuario consegue visualizar a forca da senha ao editar.

## Area Publica

O componente `AuthShell.tsx` organiza as telas acessiveis sem login:

- `Login`
- `Register`
- `ForgotPassword`

O `ForgotPassword` ainda e uma simulacao, pois nao existe backend nem envio real de e-mail.

## Area Interna

O componente `Workspace.tsx` monta a area logada.

Ele possui:

- sidebar;
- navegacao;
- botao de tema;
- logout;
- cabecalho;
- identificacao do usuario;
- conteudo principal.

As paginas internas sao:

- `Dashboard`
- `CalendarPage`
- `ChartsPage`
- `Settings`
- `AdminPanel`

O botao de admin aparece apenas para o usuario administrador.

## Dashboard de Tarefas

O `Dashboard.tsx` gerencia as tarefas do usuario.

As tarefas ficam em:

```txt
taskflow_tasks
```

O componente filtra apenas tarefas do usuario logado:

```ts
tasks.filter(task => task.userId === user.id)
```

Funcionalidades do dashboard:

- criar tarefa pelo botao `+ Nova tarefa`;
- abrir a barra de criacao acima da busca;
- buscar tarefas;
- filtrar por todas, pendentes, concluidas e vencidas;
- ordenar por data, prazo ou prioridade;
- editar titulo, descricao, prazo, categoria e prioridade;
- marcar tarefa como concluida;
- alterar status;
- excluir com confirmacao;
- adicionar, concluir e remover subtarefas;
- ver alerta de tarefas vencidas;
- acompanhar progresso em painel fixo lateral.

## Calendario

O `CalendarPage.tsx` mostra as tarefas em formato de calendario mensal.

Ele permite:

- ver tarefas no dia do prazo;
- navegar para mes anterior;
- voltar para o mes atual;
- navegar para o proximo mes;
- selecionar diretamente um mes que possui tarefas marcadas.

Esse seletor e gerado a partir das tarefas com `dueDate`.

## Graficos

O `ChartsPage.tsx` exibe metricas visuais sobre as tarefas.

Ele mostra:

- porcentagem de tarefas concluidas;
- distribuicao por status;
- distribuicao por categoria;
- distribuicao por prioridade.

Os graficos sao feitos com CSS, sem biblioteca externa.

## Configuracoes

O `Settings.tsx` permite editar:

- nome;
- e-mail;
- senha;
- avatar.

Tambem mostra:

- forca da senha;
- inicio da sessao;
- tempo de sessao ativa.

Quando a senha e alterada, o sistema atualiza `passwordUpdatedAt` e registra um evento de seguranca.

## Painel Administrativo

O `AdminPanel.tsx` so pode ser acessado pelo usuario com id `1`.

O admin pode:

- listar usuarios;
- buscar usuarios;
- editar nome e e-mail;
- visualizar senha;
- ver quantidade de tarefas por usuario;
- deletar usuarios comuns com confirmacao;
- visualizar historico de eventos de seguranca.

Ao deletar um usuario, suas tarefas tambem sao removidas.

## Hook useLocalStorage

O `useLocalStorage.ts` e um hook generico para sincronizar estado React com `localStorage`.

Ele funciona de forma parecida com `useState`, mas salva automaticamente o valor no navegador.

Exemplo:

```ts
const [darkMode, setDarkMode] = useLocalStorage('taskflow_dark_mode', false)
```

Ele e usado para:

- tema claro/escuro;
- tarefas;
- leitura auxiliar no admin.

## Tema Claro e Escuro

O tema e controlado no `App.tsx`.

Quando `darkMode` e verdadeiro:

```tsx
<main className="app dark">
```

O CSS altera variaveis como:

- fundo;
- texto;
- paineis;
- bordas;
- cores de destaque;
- sombras.

## Fluxo Geral da Arquitetura

```txt
main.tsx
  AuthProvider
    App
      AuthShell
        Login
        Register
        ForgotPassword

      Workspace
        Dashboard
        CalendarPage
        ChartsPage
        Settings
        AdminPanel
```

Fluxo simplificado de autenticacao:

```txt
Usuario envia login
  AuthContext verifica bloqueio
    valida credenciais
      cria cookie de sessao
      registra evento
      atualiza currentUser
```

Fluxo simplificado de tarefas:

```txt
Usuario cria ou edita tarefa
  Dashboard atualiza estado
    useLocalStorage salva em taskflow_tasks
      interface renderiza novamente
```

Fluxo de dados sensiveis:

```txt
Dados do usuario em memoria
  secureStorage criptografa campos sensiveis
    localStorage recebe valores tfenc:
      app descriptografa ao carregar
```

## Pontos Fortes

O projeto demonstra:

- componentizacao em React;
- uso de TypeScript;
- Context API;
- hooks personalizados;
- persistencia local;
- cookies;
- criptografia local;
- metricas de seguranca;
- controle de tentativas de login;
- renderizacao condicional;
- tema claro/escuro;
- dashboard com filtros;
- calendario;
- graficos;
- painel administrativo;
- layout responsivo.

## Limitacoes

Como nao existe backend, algumas limitacoes continuam:

- a autenticacao nao e segura como em um sistema real;
- a chave da criptografia local fica no frontend;
- senhas deveriam ser armazenadas com hash em um backend real;
- cookies nao sao `HttpOnly`, pois isso exige servidor;
- o usuario pode manipular dados pelo DevTools;
- os dados existem apenas no navegador atual;
- recuperacao de senha e apenas simulada;
- o admin ainda e identificado por `id === '1'`.

Para producao, seria necessario:

- backend;
- banco de dados;
- hash de senha;
- token ou sessao segura;
- cookies `HttpOnly`;
- validacao no servidor;
- controle real de permissoes;
- auditoria no backend;
- recuperacao de senha real.

## Conclusao

O TaskFlow evoluiu para uma aplicacao React completa de gerenciamento de tarefas com autenticacao local, painel administrativo, calendario, graficos e metricas de seguranca.

A arquitetura usa `AuthContext` para autenticacao, `useLocalStorage` para persistencia simples, `security.ts` para metricas e bloqueio de login, e `secureStorage.ts` para proteger campos sensiveis no `localStorage`.

Mesmo sendo um projeto frontend academico, ele demonstra conceitos importantes de organizacao de codigo, gerenciamento de estado, persistencia, validacao, seguranca local, interface responsiva e experiencia do usuario.
