# LidaCacau - Guia de Desenvolvimento (Development Playbook)

Este documento detalha cada passo do desenvolvimento do LidaCacau de forma que possa ser replicado em qualquer linguagem ou framework.

## Sumario

1. [Modelos de Dados](#modelos-de-dados)
2. [Contratos de API](#contratos-de-api)
3. [Regras de Negocio](#regras-de-negocio)
4. [Fluxos de Usuario](#fluxos-de-usuario)
5. [Servicos e Integrações](#servicos-e-integracoes)

---

## Modelos de Dados

### Entidades Principais

#### 1. Usuario (User)

```
User {
  id: string (UUID)
  email: string (unique, indexed)
  password: string (hash bcrypt em producao)
  name: string
  phone?: string
  location?: string
  
  // Sistema de papeis
  role: 'producer' | 'worker' | 'admin'
  roles: ['producer', 'worker'] // Papeis disponiveis
  activeRole: 'producer' | 'worker' // Papel ativo atual
  
  // Perfil visual
  avatar?: string (URL ou base64)
  coverPhoto?: string
  
  // Gamificacao
  level?: 1-5 (nivel como trabalhador)
  producerLevel?: 1-5 (nivel como produtor)
  totalReviews?: number
  averageRating?: number (0-5)
  
  // Verificacao de identidade
  verification: {
    status: 'none' | 'pending' | 'approved' | 'rejected'
    documentType?: 'rg' | 'cnh' | 'ctps'
    documentPhotoUri?: string
    selfiePhotoUri?: string
    submittedAt?: timestamp
    reviewedAt?: timestamp
    rejectionReason?: string
  }
  
  // Perfis por papel
  workerProfile?: RoleProfile
  producerProfile?: RoleProfile
  
  // Metadados
  createdAt: timestamp
  tutorialCompleted: boolean
}
```

**Regras de Negocio:**
- Email deve ser unico no sistema
- Senha minima de 6 caracteres
- Usuarios podem ter multiplos papeis
- Nivel vai de 1 (iniciante) a 5 (mestre)
- Verificacao de identidade requer foto de documento + selfie

#### 2. Propriedade Rural (PropertyDetail)

```
PropertyDetail {
  id: string (UUID)
  ownerId: string (FK -> User.id)
  
  // Informacoes basicas
  name: string
  address: string
  city: string
  state: string
  areaHectares?: number
  
  // Geolocalizacao
  latitude: number
  longitude: number
  
  // Delimitacao por poligono (GeoJSON)
  polygonBoundary?: {
    type: 'Polygon'
    coordinates: number[][][] // [[lng, lat], [lng, lat], ...]
  }
  
  // Talhos (subdivisoes da propriedade)
  talhoes?: Talhao[]
  
  // Documentacao CAR
  documents?: PropertyDocument[]
  
  // Verificacao
  verificationStatus: 'pending' | 'verified' | 'rejected'
  verifiedAt?: timestamp
  
  coverPhotoUri?: string
  createdAt: timestamp
  updatedAt: timestamp
}

Talhao {
  id: string
  name: string
  areaHectares: number
  cropType: 'cacau' | 'cafe' | 'banana' | 'pasto' | 'reserva' | 'outro'
  serviceTags: ServiceTag[]
  notes?: string
}

ServiceTag {
  id: string
  serviceTypeId: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: timestamp
}

PropertyDocument {
  id: string
  type: 'car' | 'matricula' | 'licenca_ambiental' | 'outro'
  name: string
  fileUri: string
  uploadedAt: timestamp
  status: 'pending' | 'verified' | 'rejected'
}
```

**Regras de Negocio:**
- Propriedade pertence a um unico produtor
- Poligono permite calcular area real em hectares
- CAR (Cadastro Ambiental Rural) e documento importante
- Talhoes permitem organizar areas por tipo de cultura

#### 3. Demanda de Trabalho (Job)

```
Job {
  id: string (UUID)
  producerId: string (FK -> User.id)
  
  // Servico
  serviceTypeId: string (FK -> ServiceType.id)
  quantity: number
  
  // Localizacao
  locationText: string
  latitude?: number
  longitude?: number
  
  // Periodo
  startDate?: timestamp
  endDate?: timestamp
  
  // Valor
  offer: number (valor em BRL)
  
  // Detalhes
  notes?: string
  photos?: string[]
  
  status: 'open' | 'assigned' | 'closed'
  createdAt: timestamp
}
```

**Regras de Negocio:**
- Apenas produtores podem criar demandas
- Demanda aberta pode receber propostas
- Ao aceitar proposta, status muda para 'assigned'
- Ao concluir trabalho, status muda para 'closed'

#### 4. Proposta (Bid)

```
Bid {
  id: string (UUID)
  jobId: string (FK -> Job.id)
  workerId: string (FK -> User.id)
  
  price: number (valor proposto em BRL)
  message?: string
  
  // Termos de pagamento propostos
  proposedTerms?: PaymentTerms
  
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: timestamp
}

PaymentTerms {
  type: 'per_unit' | 'per_hour' | 'per_day' | 'full_after' | 'split_50_50' | 'split_30_70' | 'advance_custom'
  advancePercentage?: number (para split_custom)
  unitPrice?: number
  estimatedUnits?: number
  hourlyRate?: number
  dailyRate?: number
  notes?: string
}
```

**Regras de Negocio:**
- Trabalhador pode fazer apenas 1 proposta por demanda
- Produtor pode aceitar apenas 1 proposta por demanda
- Ao aceitar, cria-se um WorkOrder automaticamente

#### 5. Ordem de Servico (WorkOrder)

```
WorkOrder {
  id: string (UUID)
  jobId: string (FK -> Job.id)
  workerId: string (FK -> User.id)
  producerId: string (FK -> User.id)
  
  finalPrice: number
  status: 'assigned' | 'checked_in' | 'checked_out' | 'completed'
  
  // Termos acordados
  paymentTerms?: PaymentTerms
  negotiationHistory?: NegotiationProposal[]
  
  // Contrato digital
  signedContract?: SignedContract
  
  // Pagamento
  payment?: WorkOrderPayment
  
  // Check-in/Check-out GPS
  checkInTime?: timestamp
  checkInLatitude?: number
  checkInLongitude?: number
  checkOutTime?: timestamp
  checkOutLatitude?: number
  checkOutLongitude?: number
  
  // Fotos de evidencia
  photoBefore?: string
  photoAfter?: string
  
  createdAt: timestamp
}

WorkOrderPayment {
  status: 'pending' | 'processing' | 'paid' | 'failed'
  breakdown: {
    totalValue: number
    platformFee: number (10%)
    workerPayout: number (90%)
    advancePaid?: number
    remainingToPay: number
  }
  workerPaidAt?: timestamp
  platformPaidAt?: timestamp
}
```

**Regras de Negocio:**
- Check-in registra inicio do trabalho com GPS
- Check-out registra fim com GPS e fotos
- Taxa da plataforma: 10% (configuravel)
- Pagamento via PIX com QR Code

#### 6. Avaliacao (Review)

```
Review {
  id: string (UUID)
  workOrderId: string (FK -> WorkOrder.id)
  reviewerId: string (FK -> User.id)
  revieweeId: string (FK -> User.id)
  reviewerRole: 'producer' | 'worker'
  
  // 5 criterios (1-5 estrelas cada)
  quality: number
  safety: number
  punctuality: number
  communication: number
  fairness: number
  
  comment?: string
  createdAt: timestamp
}
```

**Regras de Negocio:**
- Avaliacao bilateral: produtor avalia trabalhador E vice-versa
- Media de avaliacoes afeta nivel do usuario
- Avaliacoes sao publicas no perfil

#### 7. Tipos de Servico (ServiceType)

```
ServiceType {
  id: string
  name: string (ex: "Colheita de Cacau")
  unit: string (ex: "saca", "hectare", "dia")
  basePrice: number (preco base por unidade)
  minLevel: 1-5 (nivel minimo para executar)
  icon: string (nome do icone Feather)
}
```

**Dados Iniciais (Seed):**
```
[
  { id: 'harvest_cocoa', name: 'Colheita de Cacau', unit: 'saca', basePrice: 15, minLevel: 1, icon: 'package' },
  { id: 'prune_cocoa', name: 'Poda de Cacau', unit: 'planta', basePrice: 3, minLevel: 2, icon: 'scissors' },
  { id: 'clear_land', name: 'Roçagem', unit: 'hectare', basePrice: 200, minLevel: 1, icon: 'wind' },
  { id: 'fence', name: 'Cerca', unit: 'metro', basePrice: 25, minLevel: 2, icon: 'grid' },
  { id: 'masonry', name: 'Pedreiro', unit: 'dia', basePrice: 150, minLevel: 2, icon: 'home' },
  { id: 'electrical', name: 'Eletricista', unit: 'dia', basePrice: 200, minLevel: 3, icon: 'zap' },
  { id: 'plumbing', name: 'Encanador', unit: 'dia', basePrice: 180, minLevel: 3, icon: 'droplet' },
  { id: 'painting', name: 'Pintor', unit: 'm²', basePrice: 20, minLevel: 2, icon: 'edit-3' },
  { id: 'carpentry', name: 'Carpinteiro', unit: 'dia', basePrice: 180, minLevel: 3, icon: 'tool' },
  { id: 'welding', name: 'Serralheiro', unit: 'dia', basePrice: 200, minLevel: 3, icon: 'settings' },
]
```

---

## Contratos de API

### Autenticacao

```
POST /auth/register
Request:
{
  "name": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "role": "producer" | "worker"
}
Response 201:
{
  "success": true,
  "user": User,
  "token": "jwt_token"
}
Response 400:
{
  "success": false,
  "error": "Email ja cadastrado"
}

---

POST /auth/login
Request:
{
  "email": "string",
  "password": "string"
}
Response 200:
{
  "success": true,
  "user": User,
  "token": "jwt_token"
}
Response 401:
{
  "success": false,
  "error": "Credenciais invalidas"
}

---

POST /auth/logout
Headers: Authorization: Bearer {token}
Response 200:
{
  "success": true
}

---

GET /auth/me
Headers: Authorization: Bearer {token}
Response 200:
{
  "user": User
}
```

### Usuarios

```
GET /users/:id
Response 200: User

PUT /users/:id
Headers: Authorization: Bearer {token}
Request: Partial<User>
Response 200: User

GET /users/search?q={query}&role={role}&verified={true|false}
Response 200: User[]

POST /users/:id/verify
Headers: Authorization: Bearer {token}
Request:
{
  "documentType": "rg" | "cnh" | "ctps",
  "documentPhotoUri": "string",
  "selfiePhotoUri": "string"
}
Response 200:
{
  "success": true,
  "verification": IdentityVerification
}
```

### Demandas (Jobs)

```
GET /jobs?status={status}&serviceTypeId={id}&lat={lat}&lng={lng}&radius={km}
Response 200: Job[]

POST /jobs
Headers: Authorization: Bearer {token}
Request:
{
  "serviceTypeId": "string",
  "quantity": number,
  "locationText": "string",
  "latitude": number,
  "longitude": number,
  "startDate": "timestamp",
  "endDate": "timestamp",
  "offer": number,
  "notes": "string",
  "photos": ["string"]
}
Response 201: Job

GET /jobs/:id
Response 200: JobWithDetails

PUT /jobs/:id
Headers: Authorization: Bearer {token}
Request: Partial<Job>
Response 200: Job

DELETE /jobs/:id
Headers: Authorization: Bearer {token}
Response 204
```

### Propostas (Bids)

```
GET /jobs/:jobId/bids
Response 200: BidWithWorker[]

POST /jobs/:jobId/bids
Headers: Authorization: Bearer {token}
Request:
{
  "price": number,
  "message": "string",
  "proposedTerms": PaymentTerms
}
Response 201: Bid

PUT /bids/:id/accept
Headers: Authorization: Bearer {token}
Response 200:
{
  "bid": Bid,
  "workOrder": WorkOrder
}

PUT /bids/:id/reject
Headers: Authorization: Bearer {token}
Response 200: Bid
```

### Ordens de Servico (WorkOrders)

```
GET /workorders?userId={id}&status={status}
Headers: Authorization: Bearer {token}
Response 200: WorkOrderWithDetails[]

GET /workorders/:id
Headers: Authorization: Bearer {token}
Response 200: WorkOrderWithDetails

POST /workorders/:id/checkin
Headers: Authorization: Bearer {token}
Request:
{
  "latitude": number,
  "longitude": number,
  "photoBefore": "string"
}
Response 200: WorkOrder

POST /workorders/:id/checkout
Headers: Authorization: Bearer {token}
Request:
{
  "latitude": number,
  "longitude": number,
  "photoAfter": "string"
}
Response 200: WorkOrder

POST /workorders/:id/complete
Headers: Authorization: Bearer {token}
Response 200: WorkOrder

POST /workorders/:id/sign-contract
Headers: Authorization: Bearer {token}
Request:
{
  "role": "producer" | "worker"
}
Response 200: WorkOrder
```

### Avaliacoes (Reviews)

```
GET /users/:id/reviews?as={producer|worker}
Response 200: Review[]

POST /workorders/:id/reviews
Headers: Authorization: Bearer {token}
Request:
{
  "quality": 1-5,
  "safety": 1-5,
  "punctuality": 1-5,
  "communication": 1-5,
  "fairness": 1-5,
  "comment": "string"
}
Response 201: Review
```

### Propriedades

```
GET /properties?ownerId={id}
Headers: Authorization: Bearer {token}
Response 200: PropertyDetail[]

POST /properties
Headers: Authorization: Bearer {token}
Request: PropertyDetail
Response 201: PropertyDetail

PUT /properties/:id
Headers: Authorization: Bearer {token}
Request: Partial<PropertyDetail>
Response 200: PropertyDetail

DELETE /properties/:id
Headers: Authorization: Bearer {token}
Response 204

POST /properties/:id/talhoes
Headers: Authorization: Bearer {token}
Request: Talhao
Response 201: Talhao

POST /properties/:id/documents
Headers: Authorization: Bearer {token}
Request: PropertyDocument
Response 201: PropertyDocument
```

### Social (Amigos/Chat)

```
GET /friends
Headers: Authorization: Bearer {token}
Response 200: FriendWithUser[]

POST /friends/:userId/request
Headers: Authorization: Bearer {token}
Request:
{
  "message": "string"
}
Response 201: FriendConnection

POST /friends/:connectionId/accept
Headers: Authorization: Bearer {token}
Response 200: FriendConnection

DELETE /friends/:connectionId
Headers: Authorization: Bearer {token}
Response 204

GET /chat/rooms
Headers: Authorization: Bearer {token}
Response 200: ChatRoom[]

GET /chat/rooms/:id/messages?limit={n}&before={timestamp}
Headers: Authorization: Bearer {token}
Response 200: DirectMessage[]

POST /chat/rooms/:id/messages
Headers: Authorization: Bearer {token}
Request:
{
  "content": "string"
}
Response 201: DirectMessage
```

---

## Regras de Negocio

### Sistema de Niveis (Gamificacao)

```
Nivel 1 (Iniciante):
- 0 trabalhos
- Acesso a servicos basicos

Nivel 2 (Aprendiz):
- 5+ trabalhos completados
- Media >= 3.5 estrelas
- Desbloqueia mais servicos

Nivel 3 (Profissional):
- 15+ trabalhos completados
- Media >= 4.0 estrelas
- Pode ser mentor

Nivel 4 (Especialista):
- 30+ trabalhos completados
- Media >= 4.3 estrelas
- Badge especial

Nivel 5 (Mestre):
- 50+ trabalhos completados
- Media >= 4.5 estrelas
- Acesso total
```

### Calculo de Taxa da Plataforma

```
TAXA_PLATAFORMA = 0.10 (10%)

valorTrabalhador = valorTotal * (1 - TAXA_PLATAFORMA)
taxaPlataforma = valorTotal * TAXA_PLATAFORMA

Exemplo:
- Trabalho de R$ 500
- Trabalhador recebe: R$ 450
- Plataforma recebe: R$ 50
```

### Algoritmo de Distancia (Haversine)

```python
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Raio da Terra em km
    
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    return R * c  # Distancia em km
```

### Verificacao de Identidade

```
1. Usuario envia:
   - Foto do documento (RG, CNH ou CTPS)
   - Selfie segurando o documento

2. Admin verifica:
   - Documento legivel
   - Face corresponde a selfie
   - Dados consistentes

3. Resultado:
   - Aprovado: Badge de verificado no perfil
   - Rejeitado: Motivo informado ao usuario
```

---

## Fluxos de Usuario

### 1. Registro e Primeiro Acesso

```
1. Usuario acessa app
2. Clica em "Criar Conta"
3. Preenche: nome, email, senha, telefone
4. Escolhe papel inicial: Produtor ou Trabalhador
5. Tutorial de 6 telas explica o app
6. Redirecionado para Home

Validacoes:
- Email formato valido
- Senha >= 6 caracteres
- Telefone formato brasileiro
```

### 2. Produtor Cria Demanda

```
1. Produtor clica em "+" 
2. Seleciona "Preciso de gente pra lida"
3. Escolhe tipo de servico
4. Define quantidade e valor
5. Adiciona localizacao (GPS ou manual)
6. Opcionalmente adiciona fotos
7. Publica demanda

Resultado:
- Demanda aparece no feed
- Trabalhadores podem enviar propostas
```

### 3. Trabalhador Envia Proposta

```
1. Trabalhador ve demanda no feed
2. Clica para ver detalhes
3. Clica em "Enviar Proposta"
4. Define seu preco
5. Escolhe termos de pagamento
6. Adiciona mensagem opcional
7. Envia proposta

Resultado:
- Produtor recebe notificacao
- Proposta fica como "pendente"
```

### 4. Negociacao e Aceite

```
1. Produtor ve propostas na demanda
2. Pode contra-propor valor
3. Ao chegar em acordo, aceita proposta
4. Sistema gera WorkOrder automaticamente
5. Contrato digital e criado
6. Ambos assinam digitalmente

Resultado:
- Trabalho agendado
- Check-in liberado na data
```

### 5. Execucao do Trabalho (Check-in/out)

```
Check-in:
1. Trabalhador chega ao local
2. Abre WorkOrder no app
3. Clica "Iniciar Trabalho"
4. GPS registra localizacao
5. Tira foto "antes"

Check-out:
1. Trabalhador conclui servico
2. Clica "Finalizar Trabalho"
3. GPS registra localizacao
4. Tira foto "depois"
5. Solicita conclusao

Resultado:
- Produtor confirma conclusao
- Pagamento e liberado
- Avaliacoes solicitadas
```

### 6. Avaliacao Bilateral

```
1. Trabalho concluido
2. Produtor avalia trabalhador (5 criterios)
3. Trabalhador avalia produtor (5 criterios)
4. Comentarios opcionais
5. Avaliacoes salvas

Impacto:
- Media atualizada no perfil
- Nivel pode subir/descer
- Badges podem ser concedidos
```

---

## Servicos e Integracoes

### PIX (OpenPix)

```
Configuracao:
- OPENPIX_APP_ID: ID do aplicativo OpenPix

Fluxo de Pagamento:
1. Gerar cobranca PIX para trabalhador
2. Gerar QR Code
3. Produtor escaneia e paga
4. Webhook confirma pagamento
5. Marcar como pago no sistema

Endpoints OpenPix:
- POST /charge: Criar cobranca
- GET /charge/{id}: Status da cobranca
- Webhook /openpix: Receber confirmacoes
```

### GPS e Mapas

```
Expo Location:
- requestForegroundPermissionsAsync()
- getCurrentPositionAsync()
- Accuracy: Balanced (100m)

React Native Maps:
- MapView com markers
- Region baseada em Uruara (-3.7167, -53.7333)
- Raio de busca configuravel
```

### Armazenamento de Imagens

```
Expo Image Picker:
- launchCameraAsync() para fotos
- launchImageLibraryAsync() para galeria

Producao:
- Upload para S3/Cloudinary
- Guardar URL no banco
- CDN para servir imagens
```

### Notificacoes Push

```
Expo Notifications:
- requestPermissionsAsync()
- scheduleNotificationAsync()

Eventos para notificar:
- Nova proposta recebida
- Proposta aceita/rejeitada
- Trabalho iniciado
- Trabalho concluido
- Pagamento recebido
- Nova mensagem de chat
```

---

## Proximos Passos

1. **Backend API**: Implementar endpoints usando Node/Express, Django ou Go
2. **Banco de Dados**: PostgreSQL com migrations via Drizzle/Alembic
3. **Autenticacao**: JWT com refresh tokens
4. **Pagamentos**: Integracao OpenPix para PIX real
5. **Storage**: S3 para imagens
6. **Notificacoes**: Firebase Cloud Messaging
