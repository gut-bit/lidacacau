# LidaCacau - Estrategia de Exportacao

Este documento explica como exportar o projeto LidaCacau para um servidor proprietario.

## Sumario

1. [Estrutura do Pacote de Exportacao](#estrutura-do-pacote)
2. [Separacao Frontend/Backend](#separacao-frontend-backend)
3. [Migracao por Stack](#migracao-por-stack)
4. [Checklist de Exportacao](#checklist-de-exportacao)
5. [Scripts de Migracao](#scripts-de-migracao)

---

## Estrutura do Pacote de Exportacao

### Arquivos Essenciais para Exportar

```
lidacacau-export/
├── docs/
│   ├── development-playbook.md   # Guia completo de desenvolvimento
│   ├── export-strategy.md        # Este documento
│   └── api-spec.json             # OpenAPI 3.0 specification
│
├── contracts/
│   ├── types.ts                  # Tipos TypeScript (referencia)
│   └── models/                   # Modelos em diferentes linguagens
│       ├── python/
│       │   └── models.py
│       ├── go/
│       │   └── models.go
│       └── java/
│           └── Models.java
│
├── database/
│   ├── schema.sql               # Schema PostgreSQL
│   ├── seed-data.sql            # Dados iniciais
│   └── migrations/
│       ├── 001_initial.sql
│       └── ...
│
├── frontend/
│   └── (copia do app Expo)      # Para continuar desenvolvendo
│
└── backend-templates/
    ├── node-express/            # Template Node.js + Express
    ├── python-django/           # Template Python + Django
    └── go-fiber/                # Template Go + Fiber
```

### Gerando o Pacote

Execute o script de exportacao:

```bash
# No diretorio raiz do projeto
./scripts/export-project.sh
```

Ou manualmente:

```bash
# Criar diretorio de exportacao
mkdir -p lidacacau-export/{docs,contracts,database,frontend,backend-templates}

# Copiar documentacao
cp docs/*.md lidacacau-export/docs/
cp ARCHITECTURE.md lidacacau-export/docs/

# Copiar tipos
cp types/index.ts lidacacau-export/contracts/types.ts

# Copiar frontend
cp -r . lidacacau-export/frontend/ --exclude=node_modules --exclude=.git

# Gerar schema SQL
node scripts/generate-schema.js > lidacacau-export/database/schema.sql
```

---

## Separacao Frontend/Backend

### O Que Fica no Frontend (Expo)

```
✓ Telas e componentes React Native
✓ Navegacao
✓ Estilos e tema
✓ Logica de UI
✓ Chamadas de API (fetch/axios)
✓ Armazenamento local (cache)
✓ Geolocation e camera
```

### O Que Vai para o Backend

```
→ Autenticacao (JWT, sessoes)
→ Validacao de dados
→ Regras de negocio
→ Persistencia (PostgreSQL)
→ Upload de arquivos (S3)
→ Notificacoes push
→ Webhooks de pagamento
→ Rate limiting
→ Logs e monitoramento
```

### Camada de Servicos (Abstraction Layer)

O frontend usa uma camada de servicos que abstrai a comunicacao:

```typescript
// services/ServiceFactory.ts

// MODO MVP (AsyncStorage local)
getAuthService(): IAuthService {
  return new MockAuthService(); // Usa AsyncStorage
}

// MODO PRODUCAO (API real)
getAuthService(): IAuthService {
  return new ApiAuthService(); // Usa fetch para API
}
```

Para migrar:

1. Crie `ApiAuthService` implementando `IAuthService`
2. Troque a instanciacao no `ServiceFactory`
3. Repita para cada servico

---

## Migracao por Stack

### Node.js + Express + Prisma

```
backend-templates/node-express/
├── package.json
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── jobs.ts
│   │   └── ...
│   ├── services/
│   │   ├── AuthService.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── validation.ts
│   └── utils/
│       └── jwt.ts
└── tests/
```

**Prisma Schema (exemplo):**

```prisma
// prisma/schema.prisma

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  passwordHash    String
  name            String
  phone           String?
  role            Role     @default(WORKER)
  roles           Role[]
  activeRole      Role
  level           Int      @default(1)
  verified        Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  jobs            Job[]
  bids            Bid[]
  workOrdersAsWorker   WorkOrder[] @relation("Worker")
  workOrdersAsProducer WorkOrder[] @relation("Producer")
  reviewsGiven    Review[] @relation("Reviewer")
  reviewsReceived Review[] @relation("Reviewee")
}

enum Role {
  PRODUCER
  WORKER
  ADMIN
}

model Job {
  id            String   @id @default(uuid())
  producerId    String
  producer      User     @relation(fields: [producerId], references: [id])
  serviceTypeId String
  quantity      Int
  locationText  String
  latitude      Float?
  longitude     Float?
  offer         Float
  status        JobStatus @default(OPEN)
  createdAt     DateTime @default(now())
  
  bids          Bid[]
  workOrders    WorkOrder[]
}

// ... continua
```

**Instalacao:**

```bash
cd backend-templates/node-express
npm install
npx prisma migrate dev
npm run dev
```

---

### Python + Django + Django REST Framework

```
backend-templates/python-django/
├── requirements.txt
├── manage.py
├── lidacacau/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── users/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── jobs/
│   ├── workorders/
│   └── social/
└── tests/
```

**Models (exemplo):**

```python
# apps/users/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ('producer', 'Producer'),
        ('worker', 'Worker'),
        ('admin', 'Admin'),
    ]
    
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='worker')
    active_role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='worker')
    level = models.IntegerField(default=1)
    avatar = models.URLField(blank=True)
    is_verified = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'users'


class Job(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('assigned', 'Assigned'),
        ('closed', 'Closed'),
    ]
    
    producer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='jobs')
    service_type_id = models.CharField(max_length=50)
    quantity = models.IntegerField()
    location_text = models.CharField(max_length=255)
    latitude = models.FloatField(null=True)
    longitude = models.FloatField(null=True)
    offer = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'jobs'
```

**Instalacao:**

```bash
cd backend-templates/python-django
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

### Go + Fiber + GORM

```
backend-templates/go-fiber/
├── go.mod
├── go.sum
├── main.go
├── config/
│   └── config.go
├── models/
│   ├── user.go
│   ├── job.go
│   └── ...
├── handlers/
│   ├── auth.go
│   ├── jobs.go
│   └── ...
├── middleware/
│   └── auth.go
└── database/
    └── database.go
```

**Models (exemplo):**

```go
// models/user.go

package models

import (
    "time"
    "github.com/google/uuid"
    "gorm.io/gorm"
)

type Role string

const (
    RoleProducer Role = "producer"
    RoleWorker   Role = "worker"
    RoleAdmin    Role = "admin"
)

type User struct {
    ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
    Email        string    `gorm:"uniqueIndex;not null"`
    PasswordHash string    `gorm:"not null"`
    Name         string    `gorm:"not null"`
    Phone        string
    Role         Role      `gorm:"default:'worker'"`
    ActiveRole   Role      `gorm:"default:'worker'"`
    Level        int       `gorm:"default:1"`
    IsVerified   bool      `gorm:"default:false"`
    CreatedAt    time.Time
    UpdatedAt    time.Time
    DeletedAt    gorm.DeletedAt `gorm:"index"`
    
    Jobs         []Job      `gorm:"foreignKey:ProducerID"`
    Bids         []Bid      `gorm:"foreignKey:WorkerID"`
}

type Job struct {
    ID            uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
    ProducerID    uuid.UUID `gorm:"type:uuid;not null"`
    Producer      User      `gorm:"foreignKey:ProducerID"`
    ServiceTypeID string    `gorm:"not null"`
    Quantity      int       `gorm:"not null"`
    LocationText  string    `gorm:"not null"`
    Latitude      *float64
    Longitude     *float64
    Offer         float64   `gorm:"not null"`
    Status        string    `gorm:"default:'open'"`
    CreatedAt     time.Time
}
```

**Instalacao:**

```bash
cd backend-templates/go-fiber
go mod download
go run main.go
```

---

## Checklist de Exportacao

### Antes de Exportar

- [ ] Remover dados mock de producao (`enableMockData: false`)
- [ ] Remover credenciais de demo do codigo
- [ ] Atualizar URLs de API em `config/app.config.ts`
- [ ] Verificar que nenhuma senha esta em texto puro
- [ ] Testar build de producao

### Arquivos a Exportar

- [ ] `types/index.ts` - Definicoes de tipos
- [ ] `services/interfaces/*.ts` - Contratos de servico
- [ ] `docs/*.md` - Documentacao
- [ ] `ARCHITECTURE.md` - Arquitetura
- [ ] `constants/theme.ts` - Cores e design

### Configuracao do Backend

- [ ] PostgreSQL configurado
- [ ] Variaveis de ambiente definidas
- [ ] Migrations executadas
- [ ] Dados iniciais (seed) inseridos
- [ ] CORS configurado para dominio do app
- [ ] HTTPS habilitado

### Atualizacao do Frontend

- [ ] `API_BASE_URL` apontando para servidor
- [ ] ServiceFactory usando ApiServices
- [ ] Testar login/registro
- [ ] Testar fluxos principais
- [ ] Build de producao funcionando

---

## Scripts de Migracao

### Converter Tipos TypeScript para Outras Linguagens

**Para Python (Pydantic):**

```python
# scripts/ts-to-python.py

import re

ts_types = open('types/index.ts').read()

# Mapear tipos
type_map = {
    'string': 'str',
    'number': 'float',
    'boolean': 'bool',
    'string[]': 'List[str]',
}

# Gerar classes Pydantic
print("""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    producer = "producer"
    worker = "worker"
    admin = "admin"

class User(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: UserRole
    level: int = 1
    created_at: datetime
    
    class Config:
        orm_mode = True
""")
```

**Para Go (structs):**

```go
// scripts/ts-to-go.go

// Gerar structs Go a partir dos tipos TypeScript
// (implementacao simplificada)

type User struct {
    ID        string    `json:"id"`
    Email     string    `json:"email"`
    Name      string    `json:"name"`
    Phone     *string   `json:"phone,omitempty"`
    Role      string    `json:"role"`
    Level     int       `json:"level"`
    CreatedAt time.Time `json:"createdAt"`
}
```

### Gerar Schema SQL

```javascript
// scripts/generate-schema.js

const schema = `
-- LidaCacau Database Schema
-- PostgreSQL 14+

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para geolocation

-- Enums
CREATE TYPE user_role AS ENUM ('producer', 'worker', 'admin');
CREATE TYPE job_status AS ENUM ('open', 'assigned', 'closed');
CREATE TYPE workorder_status AS ENUM ('assigned', 'checked_in', 'checked_out', 'completed');
CREATE TYPE verification_status AS ENUM ('none', 'pending', 'approved', 'rejected');

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    location VARCHAR(255),
    role user_role NOT NULL DEFAULT 'worker',
    active_role user_role NOT NULL DEFAULT 'worker',
    level INTEGER NOT NULL DEFAULT 1,
    avatar TEXT,
    verification_status verification_status DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(2),
    area_hectares DECIMAL(10, 2),
    location GEOGRAPHY(POINT, 4326),
    polygon_boundary GEOGRAPHY(POLYGON, 4326),
    verification_status verification_status DEFAULT 'pending',
    cover_photo_uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Types
CREATE TABLE service_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    min_level INTEGER NOT NULL DEFAULT 1,
    icon VARCHAR(50)
);

-- Jobs
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_type_id VARCHAR(50) REFERENCES service_types(id),
    quantity INTEGER NOT NULL,
    location_text VARCHAR(255) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    start_date DATE,
    end_date DATE,
    offer DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    status job_status DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bids
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, worker_id)
);

-- Work Orders
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id),
    producer_id UUID REFERENCES users(id),
    final_price DECIMAL(10, 2) NOT NULL,
    status workorder_status DEFAULT 'assigned',
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_in_location GEOGRAPHY(POINT, 4326),
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_out_location GEOGRAPHY(POINT, 4326),
    photo_before TEXT,
    photo_after TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    reviewee_id UUID REFERENCES users(id),
    reviewer_role user_role NOT NULL,
    quality INTEGER CHECK (quality BETWEEN 1 AND 5),
    safety INTEGER CHECK (safety BETWEEN 1 AND 5),
    punctuality INTEGER CHECK (punctuality BETWEEN 1 AND 5),
    communication INTEGER CHECK (communication BETWEEN 1 AND 5),
    fairness INTEGER CHECK (fairness BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_producer ON jobs(producer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_location ON jobs USING GIST(location);
CREATE INDEX idx_bids_job ON bids(job_id);
CREATE INDEX idx_work_orders_worker ON work_orders(worker_id);
CREATE INDEX idx_work_orders_producer ON work_orders(producer_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);

-- Seed Service Types
INSERT INTO service_types (id, name, unit, base_price, min_level, icon) VALUES
('harvest_cocoa', 'Colheita de Cacau', 'saca', 15.00, 1, 'package'),
('prune_cocoa', 'Poda de Cacau', 'planta', 3.00, 2, 'scissors'),
('clear_land', 'Rocagem', 'hectare', 200.00, 1, 'wind'),
('fence', 'Cerca', 'metro', 25.00, 2, 'grid'),
('masonry', 'Pedreiro', 'dia', 150.00, 2, 'home'),
('electrical', 'Eletricista', 'dia', 200.00, 3, 'zap'),
('plumbing', 'Encanador', 'dia', 180.00, 3, 'droplet'),
('painting', 'Pintor', 'm2', 20.00, 2, 'edit-3'),
('carpentry', 'Carpinteiro', 'dia', 180.00, 3, 'tool'),
('welding', 'Serralheiro', 'dia', 200.00, 3, 'settings');
`;

console.log(schema);
```

---

## Variaveis de Ambiente

### Frontend (Expo)

```env
# .env (frontend)
API_BASE_URL=https://api.lidacacau.com.br
OPENPIX_APP_ID=your-openpix-app-id
```

### Backend

```env
# .env (backend)
DATABASE_URL=postgresql://user:pass@localhost:5432/lidacacau
JWT_SECRET=your-jwt-secret-key
OPENPIX_APP_ID=your-openpix-app-id
OPENPIX_WEBHOOK_SECRET=your-webhook-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=lidacacau-uploads
FCM_SERVER_KEY=your-firebase-key
```

---

## Suporte

Para duvidas sobre a migracao:
1. Consulte `ARCHITECTURE.md` para decisoes arquiteturais
2. Consulte `development-playbook.md` para regras de negocio
3. Verifique `types/index.ts` para estrutura de dados
