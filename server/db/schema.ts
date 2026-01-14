import { pgTable, uuid, varchar, text, timestamp, boolean, integer, decimal, jsonb, primaryKey, unique } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  location: varchar('location', { length: 255 }),
  role: varchar('role', { length: 20 }).notNull().default('worker'),
  roles: text('roles').array().default(sql`ARRAY['worker']`),
  activeRole: varchar('active_role', { length: 20 }).notNull().default('worker'),
  avatar: text('avatar'),
  coverPhoto: text('cover_photo'),
  level: integer('level').default(1),
  producerLevel: integer('producer_level').default(1),
  totalReviews: integer('total_reviews').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0'),
  producerReviews: integer('producer_reviews').default(0),
  producerRating: decimal('producer_rating', { precision: 3, scale: 2 }).default('0'),
  tutorialCompleted: boolean('tutorial_completed').default(false),
  searchRadius: integer('search_radius').default(50),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileType: varchar('profile_type', { length: 20 }).notNull(),
  bio: text('bio'),
  skills: text('skills').array(),
  equipment: text('equipment').array(),
  certifications: text('certifications').array(),
  availability: varchar('availability', { length: 255 }),
  preferredRadius: integer('preferred_radius').default(50),
  totalJobs: integer('total_jobs').default(0),
  totalEarnings: decimal('total_earnings', { precision: 12, scale: 2 }).default('0'),
  totalSpent: decimal('total_spent', { precision: 12, scale: 2 }).default('0'),
  pixKey: varchar('pix_key', { length: 255 }),
  pixKeyType: varchar('pix_key_type', { length: 20 }),
});

export const userVerification = pgTable('user_verification', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  status: varchar('status', { length: 20 }).notNull().default('none'),
  documentType: varchar('document_type', { length: 20 }),
  documentPhotoUri: text('document_photo_uri'),
  selfiePhotoUri: text('selfie_photo_uri'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const serviceTypes = pgTable('service_types', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  name: varchar('name', { length: 255 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  minLevel: integer('min_level').default(1),
  icon: varchar('icon', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  city: varchar('city', { length: 255 }).default('Uruara'),
  state: varchar('state', { length: 50 }).default('PA'),
  areaHectares: decimal('area_hectares', { precision: 10, scale: 2 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  polygonBoundary: jsonb('polygon_boundary'),
  verificationStatus: varchar('verification_status', { length: 20 }).default('pending'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  coverPhotoUri: text('cover_photo_uri'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const talhoes = pgTable('talhoes', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  areaHectares: decimal('area_hectares', { precision: 10, scale: 2 }).notNull(),
  cropType: varchar('crop_type', { length: 50 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  producerId: uuid('producer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  serviceTypeId: uuid('service_type_id').notNull().references(() => serviceTypes.id),
  quantity: integer('quantity').notNull(),
  locationText: varchar('location_text', { length: 255 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  startDate: timestamp('start_date', { mode: 'date' }),
  endDate: timestamp('end_date', { mode: 'date' }),
  offer: decimal('offer', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  photos: text('photos').array(),
  status: varchar('status', { length: 20 }).default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const bids = pgTable('bids', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  workerId: uuid('worker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  message: text('message'),
  proposedTerms: jsonb('proposed_terms'),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const workOrders = pgTable('work_orders', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  jobId: uuid('job_id').notNull().references(() => jobs.id),
  workerId: uuid('worker_id').notNull().references(() => users.id),
  producerId: uuid('producer_id').notNull().references(() => users.id),
  finalPrice: decimal('final_price', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('assigned'),
  paymentTerms: jsonb('payment_terms'),
  checkInTime: timestamp('check_in_time', { withTimezone: true }),
  checkInLatitude: decimal('check_in_latitude', { precision: 10, scale: 7 }),
  checkInLongitude: decimal('check_in_longitude', { precision: 10, scale: 7 }),
  checkOutTime: timestamp('check_out_time', { withTimezone: true }),
  checkOutLatitude: decimal('check_out_latitude', { precision: 10, scale: 7 }),
  checkOutLongitude: decimal('check_out_longitude', { precision: 10, scale: 7 }),
  photoBefore: text('photo_before'),
  photoAfter: text('photo_after'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  workOrderId: uuid('work_order_id').notNull().references(() => workOrders.id, { onDelete: 'cascade' }),
  reviewerId: uuid('reviewer_id').notNull().references(() => users.id),
  revieweeId: uuid('reviewee_id').notNull().references(() => users.id),
  reviewerRole: varchar('reviewer_role', { length: 20 }).notNull(),
  quality: integer('quality').notNull(),
  safety: integer('safety').notNull(),
  punctuality: integer('punctuality').notNull(),
  communication: integer('communication').notNull(),
  fairness: integer('fairness').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const friendConnections = pgTable('friend_connections', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  requesterId: uuid('requester_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: uuid('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).default('pending'),
  message: text('message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
});

export const chatRooms = pgTable('chat_rooms', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  participantIds: uuid('participant_ids').array().notNull(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  lastMessagePreview: text('last_message_preview'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const directMessages = pgTable('direct_messages', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  roomId: uuid('room_id').notNull().references(() => chatRooms.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const userPresence = pgTable('user_presence', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  isOnline: boolean('is_online').default(false),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  data: jsonb('data'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  profiles: many(userProfiles),
  verification: one(userVerification),
  sessions: many(sessions),
  properties: many(properties),
  jobs: many(jobs),
  bids: many(bids),
  notifications: many(notifications),
  presence: one(userPresence),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, { fields: [properties.ownerId], references: [users.id] }),
  talhoes: many(talhoes),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  producer: one(users, { fields: [jobs.producerId], references: [users.id] }),
  serviceType: one(serviceTypes, { fields: [jobs.serviceTypeId], references: [serviceTypes.id] }),
  bids: many(bids),
}));

export const cocoaPriceSubmissions = pgTable('cocoa_price_submissions', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  buyerName: varchar('buyer_name', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  region: varchar('region', { length: 100 }).default('Para'),
  pricePerKg: decimal('price_per_kg', { precision: 10, scale: 2 }).notNull(),
  conditions: text('conditions'),
  proofPhotoUri: text('proof_photo_uri'),
  source: varchar('source', { length: 50 }).default('lidacacau'),
  submittedBy: uuid('submitted_by').references(() => users.id, { onDelete: 'set null' }),
  submitterName: varchar('submitter_name', { length: 255 }),
  submitterPhone: varchar('submitter_phone', { length: 50 }),
  status: varchar('status', { length: 20 }).default('pending'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const cocoaPriceMetrics = pgTable('cocoa_price_metrics', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  city: varchar('city', { length: 100 }).notNull(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  avgPrice: decimal('avg_price', { precision: 10, scale: 2 }).notNull(),
  minPrice: decimal('min_price', { precision: 10, scale: 2 }).notNull(),
  maxPrice: decimal('max_price', { precision: 10, scale: 2 }).notNull(),
  submissionCount: integer('submission_count').default(0),
  dataSource: varchar('data_source', { length: 50 }).default('mixed'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const cocoaPriceSubmissionsRelations = relations(cocoaPriceSubmissions, ({ one }) => ({
  submitter: one(users, { fields: [cocoaPriceSubmissions.submittedBy], references: [users.id] }),
  verifier: one(users, { fields: [cocoaPriceSubmissions.verifiedBy], references: [users.id] }),
}));

// ============================================
// RURAL CONNECT INTEGRATION - COMUNIDADE
// ============================================

// Types for Rural Connect entities
export type OccurrenceType = 'electrical' | 'road' | 'bridge' | 'social' | 'theft' | 'other';
export type OccurrenceStatus = 'open' | 'in_progress' | 'resolved';
export type RoadClassification = 'principal' | 'ramal';
export type TrafegabilidadeEstado = 'boa' | 'regular' | 'ruim' | 'intransitavel';
export type AlertType = 'ibama' | 'icmbio' | 'policia_ambiental' | 'sema' | 'outro';
export type AlertStatus = 'active' | 'expired' | 'cancelled';

// Vicinais (Communities/Rural Roads)
export const vicinais = pgTable('vicinais', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  nome: varchar('nome', { length: 255 }).notNull(),
  descricao: text('descricao'),
  whatsappLink: text('whatsapp_link'),
  facebookLink: text('facebook_link'),
  instagramLink: text('instagram_link'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  cidade: varchar('cidade', { length: 100 }).default('Uruara'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Roads (Estradas com coordenadas para mapa)
export const roads = pgTable('roads', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  nome: varchar('nome', { length: 255 }).notNull(),
  classification: varchar('classification', { length: 20 }).notNull().default('ramal'),
  coordinates: jsonb('coordinates').notNull(), // Array of [lat, lng] pairs
  color: varchar('color', { length: 20 }).default('#2563eb'),
  vicinalId: uuid('vicinal_id').references(() => vicinais.id, { onDelete: 'set null' }),
  trafegabilidade: varchar('trafegabilidade', { length: 20 }).default('regular'),
  trafegabilidadeDetalhe: text('trafegabilidade_detalhe'),
  agriculturaPrincipal: varchar('agricultura_principal', { length: 100 }),
  comprimentoMetros: decimal('comprimento_metros', { precision: 12, scale: 2 }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Occurrences (Infrastructure Problems)
export const occurrences = pgTable('occurrences', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  descricao: text('descricao').notNull(),
  tipo: varchar('tipo', { length: 20 }).notNull(), // electrical, road, bridge, social, theft, other
  status: varchar('status', { length: 20 }).default('open'), // open, in_progress, resolved
  vicinalId: uuid('vicinal_id').references(() => vicinais.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roadId: uuid('road_id').references(() => roads.id, { onDelete: 'set null' }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  fotos: text('fotos').array(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Occurrence Comments
export const occurrenceComments = pgTable('occurrence_comments', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  occurrenceId: uuid('occurrence_id').notNull().references(() => occurrences.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userName: varchar('user_name', { length: 255 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Petitions (Abaixo-assinados)
export const petitions = pgTable('petitions', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  descricao: text('descricao').notNull(),
  occurrenceId: uuid('occurrence_id').references(() => occurrences.id, { onDelete: 'set null' }),
  vicinalId: uuid('vicinal_id').references(() => vicinais.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fotos: text('fotos').array(),
  targetSignatures: integer('target_signatures').default(50),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Petition Signatures
export const signatures = pgTable('signatures', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  petitionId: uuid('petition_id').notNull().references(() => petitions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  signedAt: timestamp('signed_at', { withTimezone: true }).defaultNow(),
});

// Fiscalization Alerts
export const fiscalizationAlerts = pgTable('fiscalization_alerts', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  vicinalId: uuid('vicinal_id').references(() => vicinais.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tipo: varchar('tipo', { length: 30 }).notNull(), // ibama, icmbio, policia_ambiental, sema, outro
  descricao: text('descricao'),
  direcao: varchar('direcao', { length: 100 }),
  veiculos: varchar('veiculos', { length: 255 }),
  status: varchar('status', { length: 20 }).default('active'), // active, expired, cancelled
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelledBy: uuid('cancelled_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations for Rural Connect entities
export const vicinaisRelations = relations(vicinais, ({ many }) => ({
  roads: many(roads),
  occurrences: many(occurrences),
  petitions: many(petitions),
  alerts: many(fiscalizationAlerts),
}));

export const roadsRelations = relations(roads, ({ one, many }) => ({
  vicinal: one(vicinais, { fields: [roads.vicinalId], references: [vicinais.id] }),
  creator: one(users, { fields: [roads.createdBy], references: [users.id] }),
  occurrences: many(occurrences),
}));

export const occurrencesRelations = relations(occurrences, ({ one, many }) => ({
  vicinal: one(vicinais, { fields: [occurrences.vicinalId], references: [vicinais.id] }),
  user: one(users, { fields: [occurrences.userId], references: [users.id] }),
  road: one(roads, { fields: [occurrences.roadId], references: [roads.id] }),
  resolver: one(users, { fields: [occurrences.resolvedBy], references: [users.id] }),
  comments: many(occurrenceComments),
}));

export const petitionsRelations = relations(petitions, ({ one, many }) => ({
  vicinal: one(vicinais, { fields: [petitions.vicinalId], references: [vicinais.id] }),
  user: one(users, { fields: [petitions.userId], references: [users.id] }),
  occurrence: one(occurrences, { fields: [petitions.occurrenceId], references: [occurrences.id] }),
  signatures: many(signatures),
}));

export const signaturesRelations = relations(signatures, ({ one }) => ({
  petition: one(petitions, { fields: [signatures.petitionId], references: [petitions.id] }),
  user: one(users, { fields: [signatures.userId], references: [users.id] }),
}));
