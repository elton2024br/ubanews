# Prompt Estruturado: Sistema de Login Seguro com 2FA Obrigatório para Administradores

## 1. Objetivo Principal

Implementar um sistema de autenticação robusto e seguro para administradores do UbaNews, com autenticação de dois fatores (2FA) obrigatória, garantindo máxima proteção contra acessos não autorizados e ataques de força bruta.

## 2. Requisitos Específicos

### 2.1 Requisitos Funcionais

* **Autenticação Primária**: Login com email/usuário e senha

* **2FA Obrigatório**: TOTP (Time-based One-Time Password) usando aplicativos como Google Authenticator, Authy

* **Backup Codes**: Geração de códigos de recuperação únicos

* **Bloqueio de Conta**: Após múltiplas tentativas falhadas

* **Sessão Segura**: Gerenciamento de sessões com timeout automático

* **Recuperação de Conta**: Processo seguro para reset de 2FA

* **Auditoria**: Log completo de tentativas de login e ações administrativas

### 2.2 Requisitos Técnicos

* **Framework**: React com TypeScript

* **Backend**: Supabase (PostgreSQL + Auth)

* **2FA Library**: `otpauth` ou `speakeasy` para geração TOTP

* **QR Code**: `qrcode` para exibição do código de configuração

* **Criptografia**: Bcrypt para senhas, AES-256 para backup codes

* **Rate Limiting**: Implementação de throttling para tentativas de login

* **HTTPS**: Comunicação exclusivamente criptografada

### 2.3 Requisitos de Segurança

* **Política de Senhas**: Mínimo 12 caracteres, complexidade obrigatória

* **Criptografia**: Todas as senhas e códigos devem ser criptografados

* **Validação**: Sanitização de inputs e proteção contra SQL injection

* **Headers de Segurança**: CSP, HSTS, X-Frame-Options

* **Auditoria**: Logs imutáveis de todas as ações administrativas

## 3. Etapas de Implementação

### 3.1 Preparação da Infraestrutura

1. **Configurar tabelas no Supabase**:

   * `admin_users`: dados dos administradores

   * `admin_2fa_secrets`: chaves TOTP criptografadas

   * `admin_backup_codes`: códigos de recuperação

   * `admin_login_attempts`: controle de tentativas

   * `admin_audit_logs`: logs de auditoria

2. **Configurar políticas RLS (Row Level Security)**:

   * Acesso restrito apenas ao próprio usuário

   * Logs de auditoria somente leitura

3. **Instalar dependências**:

   ```bash
   npm install otpauth qrcode bcryptjs
   npm install @types/qrcode @types/bcryptjs
   ```

### 3.2 Desenvolvimento do Backend

1. **Criar funções de criptografia**:

   * Geração de chaves TOTP

   * Criptografia/descriptografia de backup codes

   * Hash de senhas com salt

2. **Implementar APIs de autenticação**:

   * `POST /api/admin/login` - Login inicial

   * `POST /api/admin/verify-2fa` - Verificação TOTP

   * `POST /api/admin/setup-2fa` - Configuração inicial 2FA

   * `POST /api/admin/generate-backup-codes` - Gerar códigos de recuperação

   * `POST /api/admin/reset-2fa` - Reset com backup code

3. **Implementar middleware de segurança**:

   * Rate limiting por IP e usuário

   * Validação de sessões

   * Logs de auditoria automáticos

### 3.3 Desenvolvimento do Frontend

1. **Criar componentes de autenticação**:

   * `AdminLoginForm`: formulário de login inicial

   * `TwoFactorSetup`: configuração inicial do 2FA

   * `TwoFactorVerify`: verificação do código TOTP

   * `BackupCodesDisplay`: exibição dos códigos de recuperação

   * `AccountRecovery`: processo de recuperação

2. **Implementar fluxos de navegação**:

   * Redirecionamento automático para setup 2FA

   * Proteção de rotas administrativas

   * Logout automático por inatividade

3. **Criar interface de gerenciamento**:

   * Dashboard de segurança

   * Histórico de logins

   * Configurações de conta

### 3.4 Integração e Testes

1. **Testes unitários**:

   * Funções de criptografia

   * Validação de TOTP

   * Geração de backup codes

2. **Testes de integração**:

   * Fluxo completo de login

   * Cenários de recuperação

   * Rate limiting

3. **Testes de segurança**:

   * Tentativas de bypass

   * Ataques de força bruta

   * Validação de inputs maliciosos

## 4. Critérios de Validação

### 4.1 Funcionalidade

* [ ] Login com email/senha funciona corretamente

* [ ] 2FA é obrigatório para todos os administradores

* [ ] QR Code é gerado e funciona com aplicativos TOTP

* [ ] Backup codes são gerados e funcionam para recuperação

* [ ] Conta é bloqueada após 5 tentativas falhadas

* [ ] Sessão expira após 30 minutos de inatividade

* [ ] Processo de recuperação funciona corretamente

### 4.2 Segurança

* [ ] Senhas são criptografadas com bcrypt

* [ ] Chaves TOTP são armazenadas criptografadas

* [ ] Backup codes são únicos e criptografados

* [ ] Rate limiting impede ataques de força bruta

* [ ] Logs de auditoria são completos e imutáveis

* [ ] Headers de segurança estão configurados

* [ ] Comunicação é exclusivamente HTTPS

### 4.3 Usabilidade

* [ ] Interface é intuitiva e responsiva

* [ ] Mensagens de erro são claras

* [ ] Processo de setup é guiado passo a passo

* [ ] Recuperação de conta é acessível

* [ ] Documentação está disponível

### 4.4 Performance

* [ ] Login completo em menos de 3 segundos

* [ ] Verificação TOTP em menos de 1 segundo

* [ ] Interface carrega rapidamente

* [ ] Não há vazamentos de memória

## 5. Restrições e Considerações Importantes

### 5.1 Restrições Técnicas

* **Compatibilidade**: Suporte apenas para navegadores modernos (ES2020+)

* **Dependências**: Minimizar bibliotecas externas para reduzir superfície de ataque

* **Armazenamento**: Dados sensíveis apenas no servidor, nunca no localStorage

* **Backup**: Códigos de recuperação limitados a 10 por usuário

### 5.2 Considerações de Segurança

* **Princípio do Menor Privilégio**: Acesso mínimo necessário

* **Defesa em Profundidade**: Múltiplas camadas de proteção

* **Fail Secure**: Em caso de erro, negar acesso

* **Auditoria Completa**: Todos os eventos devem ser logados

* **Rotação de Chaves**: Implementar rotação periódica de secrets

### 5.3 Considerações de Compliance

* **LGPD**: Proteção de dados pessoais

* **Retenção de Logs**: Manter logs por no mínimo 1 ano

* **Direito ao Esquecimento**: Implementar remoção segura de dados

* **Transparência**: Usuários devem ser informados sobre coleta de dados

### 5.4 Considerações Operacionais

* **Documentação**: Manual completo para administradores

* **Treinamento**: Capacitação da equipe sobre o novo sistema

* **Migração**: Plano para migração de usuários existentes

* **Monitoramento**: Alertas para tentativas de acesso suspeitas

* **Backup**: Estratégia de backup para recuperação de desastres

## 6. Cronograma Sugerido

### Semana 1-2: Preparação

* Configuração da infraestrutura

* Setup das tabelas e políticas

* Instal

