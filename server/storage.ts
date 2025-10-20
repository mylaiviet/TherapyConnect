import { db } from "./db";
import {
  therapists,
  users,
  adminUsers,
  therapistAvailability,
  appointments,
  therapistBookingSettings,
  blockedTimeSlots
} from "@shared/schema";
import { eq, and, or, like, gte, lte, sql } from "drizzle-orm";
import type {
  Therapist,
  InsertTherapist,
  User,
  InsertUser,
  AdminUser,
  InsertAdminUser,
  TherapistAvailability,
  InsertAvailability,
  Appointment,
  InsertAppointment,
  BookingSettings,
  InsertBookingSettings,
  BlockedTime,
  InsertBlockedTime,
  TimeSlot
} from "@shared/schema";

export interface IStorage {
  // User authentication
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;

  // Therapist profiles
  createTherapist(therapist: InsertTherapist): Promise<Therapist>;
  getTherapistById(id: string): Promise<Therapist | undefined>;
  getTherapistByUserId(userId: string): Promise<Therapist | undefined>;
  updateTherapist(id: string, data: Partial<InsertTherapist>): Promise<Therapist>;
  getAllTherapists(filters?: TherapistFilters): Promise<Therapist[]>;
  getPendingTherapists(): Promise<Therapist[]>;
  approveTherapist(id: string): Promise<Therapist>;
  rejectTherapist(id: string): Promise<Therapist>;
  incrementProfileViews(id: string): Promise<void>;
  
  // Admin users
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  getAdminUserByUserId(userId: string): Promise<AdminUser | undefined>;
  isAdmin(userId: string): Promise<boolean>;

  // Appointment Scheduling - Availability
  createAvailability(availability: InsertAvailability): Promise<TherapistAvailability>;
  getAvailability(therapistId: string): Promise<TherapistAvailability[]>;
  updateAvailability(id: string, data: Partial<InsertAvailability>): Promise<TherapistAvailability>;
  deleteAvailability(id: string): Promise<void>;

  // Appointment Scheduling - Booking Settings
  getBookingSettings(therapistId: string): Promise<BookingSettings | undefined>;
  createBookingSettings(settings: InsertBookingSettings): Promise<BookingSettings>;
  updateBookingSettings(therapistId: string, data: Partial<InsertBookingSettings>): Promise<BookingSettings>;

  // Appointment Scheduling - Appointments
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointments(therapistId: string, status?: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  updateAppointmentStatus(id: string, status: string): Promise<Appointment>;
  cancelAppointment(id: string): Promise<Appointment>;

  // Appointment Scheduling - Blocked Time
  createBlockedTime(blocked: InsertBlockedTime): Promise<BlockedTime>;
  getBlockedTimes(therapistId: string): Promise<BlockedTime[]>;
  deleteBlockedTime(id: string): Promise<void>;

  // Appointment Scheduling - Availability Checking
  getAvailableSlots(therapistId: string, date: string): Promise<TimeSlot[]>;
}

export interface TherapistFilters {
  // Location - separate fields
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  location?: string; // Deprecated - kept for backward compatibility
  radius?: number;

  specialties?: string[];
  sessionTypes?: string[];
  modalities?: string[];
  ageGroups?: string[];
  insurance?: string[];
  communities?: string[];
  priceMin?: number;
  priceMax?: number;
  acceptingNewClients?: boolean;

  // NEW FILTERS - Phase 1: Core Matching
  gender?: string[];
  certifications?: string[];
  sessionLengths?: string[];
  availableImmediately?: boolean;

  // NEW FILTERS - Phase 2: Accessibility
  wheelchairAccessible?: boolean;
  aslCapable?: boolean;
  serviceAnimalFriendly?: boolean;
  virtualPlatforms?: string[];

  // NEW FILTERS - Phase 3: Financial
  consultationOffered?: boolean;
  superbillProvided?: boolean;
  fsaHsaAccepted?: boolean;

  sortBy?: string;
}

export class DbStorage implements IStorage {
  // User authentication
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));
  }

  // Therapist profiles
  async createTherapist(insertTherapist: InsertTherapist): Promise<Therapist> {
    const [therapist] = await db.insert(therapists).values(insertTherapist).returning();
    return therapist;
  }

  async getTherapistById(id: string): Promise<Therapist | undefined> {
    const [therapist] = await db.select().from(therapists).where(eq(therapists.id, id)).limit(1);
    return therapist;
  }

  async getTherapistByUserId(userId: string): Promise<Therapist | undefined> {
    const [therapist] = await db.select().from(therapists).where(eq(therapists.userId, userId)).limit(1);
    return therapist;
  }

  async updateTherapist(id: string, data: Partial<InsertTherapist>): Promise<Therapist> {
    const [updated] = await db
      .update(therapists)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(therapists.id, id))
      .returning();
    return updated;
  }

  async getAllTherapists(filters?: TherapistFilters): Promise<Therapist[]> {
    let query = db.select().from(therapists).where(eq(therapists.profileStatus, 'approved'));

    const conditions: any[] = [eq(therapists.profileStatus, 'approved')];

    if (filters?.acceptingNewClients) {
      conditions.push(eq(therapists.acceptingNewClients, true));
    }

    if (filters?.priceMin !== undefined) {
      conditions.push(gte(therapists.individualSessionFee, filters.priceMin));
    }

    if (filters?.priceMax !== undefined) {
      conditions.push(lte(therapists.individualSessionFee, filters.priceMax));
    }

    // Location matching - support both old location field and new separate fields
    // Case-insensitive search using ILIKE (PostgreSQL) or LOWER()
    const locationQuery = filters?.city || filters?.zipCode || filters?.location;
    if (locationQuery) {
      const lowerLocation = locationQuery.toLowerCase();

      // Common misspellings map for fuzzy matching
      const cityVariants = [lowerLocation];

      // Add common phonetic variations
      const commonMisspellings: Record<string, string[]> = {
        'houston': ['huston', 'houstan', 'housten'],
        'phoenix': ['phenix', 'pheonix', 'phoneix'],
        'tucson': ['tuscon', 'tucsen', 'tukson'],
        'pittsburgh': ['pittsburg', 'pitsburgh', 'pitsburg'],
        'albuquerque': ['albequerque', 'albuquerque', 'albequerqe'],
        'miami': ['miama', 'miani', 'miammi'],
        'detroit': ['detroyt', 'detrot'],
        'boston': ['bosten', 'bawston'],
        'seattle': ['seatle', 'seatel', 'seattel'],
        'portland': ['porland', 'portlnd'],
        'denver': ['denvr', 'denvor'],
        'austin': ['austen', 'astin'],
        'dallas': ['dalas', 'dalls'],
        'sacramento': ['sacremento', 'sacremento', 'sacromento'],
      };

      // Find matching city variants
      for (const [correct, misspellings] of Object.entries(commonMisspellings)) {
        if (misspellings.includes(lowerLocation)) {
          cityVariants.push(correct);
          break;
        }
        if (correct === lowerLocation) {
          cityVariants.push(...misspellings);
          break;
        }
      }

      // Build OR conditions for all variants
      const cityConditions = cityVariants.map(variant =>
        sql`LOWER(${therapists.city}) LIKE ${`%${variant}%`}`
      );

      conditions.push(
        or(
          ...cityConditions,
          like(therapists.zipCode, `%${locationQuery}%`)
        )
      );
    }

    // State filter - case-insensitive, also accepts full state names
    if (filters?.state) {
      const stateUpper = filters.state.toUpperCase();
      conditions.push(
        or(
          sql`UPPER(${therapists.state}) = ${stateUpper}`,
          // Support full state name lookup (e.g., "Texas" -> "TX")
          sql`UPPER(${therapists.state}) IN (
            SELECT value FROM (VALUES
              ('ALABAMA', 'AL'), ('ALASKA', 'AK'), ('ARIZONA', 'AZ'), ('ARKANSAS', 'AR'),
              ('CALIFORNIA', 'CA'), ('COLORADO', 'CO'), ('CONNECTICUT', 'CT'), ('DELAWARE', 'DE'),
              ('FLORIDA', 'FL'), ('GEORGIA', 'GA'), ('HAWAII', 'HI'), ('IDAHO', 'ID'),
              ('ILLINOIS', 'IL'), ('INDIANA', 'IN'), ('IOWA', 'IA'), ('KANSAS', 'KS'),
              ('KENTUCKY', 'KY'), ('LOUISIANA', 'LA'), ('MAINE', 'ME'), ('MARYLAND', 'MD'),
              ('MASSACHUSETTS', 'MA'), ('MICHIGAN', 'MI'), ('MINNESOTA', 'MN'), ('MISSISSIPPI', 'MS'),
              ('MISSOURI', 'MO'), ('MONTANA', 'MT'), ('NEBRASKA', 'NE'), ('NEVADA', 'NV'),
              ('NEW HAMPSHIRE', 'NH'), ('NEW JERSEY', 'NJ'), ('NEW MEXICO', 'NM'), ('NEW YORK', 'NY'),
              ('NORTH CAROLINA', 'NC'), ('NORTH DAKOTA', 'ND'), ('OHIO', 'OH'), ('OKLAHOMA', 'OK'),
              ('OREGON', 'OR'), ('PENNSYLVANIA', 'PA'), ('RHODE ISLAND', 'RI'), ('SOUTH CAROLINA', 'SC'),
              ('SOUTH DAKOTA', 'SD'), ('TENNESSEE', 'TN'), ('TEXAS', 'TX'), ('UTAH', 'UT'),
              ('VERMONT', 'VT'), ('VIRGINIA', 'VA'), ('WASHINGTON', 'WA'), ('WEST VIRGINIA', 'WV'),
              ('WISCONSIN', 'WI'), ('WYOMING', 'WY'), ('DISTRICT OF COLUMBIA', 'DC')
            ) AS states(name, value)
            WHERE UPPER(${stateUpper}) = UPPER(name) OR UPPER(${stateUpper}) = value
          )`
        )
      );
    }

    const result = await db.select().from(therapists).where(and(...conditions));

    // Filter by arrays (specialties, session types, etc.) in memory
    let filtered = result;

    // Case-insensitive specialty matching
    if (filters?.specialties && filters.specialties.length > 0) {
      const lowerSpecialties = filters.specialties.map(s => s.toLowerCase());
      filtered = filtered.filter(t =>
        t.topSpecialties?.some(s => lowerSpecialties.includes(s.toLowerCase()))
      );
    }

    if (filters?.sessionTypes && filters.sessionTypes.length > 0) {
      filtered = filtered.filter(t =>
        t.sessionTypes?.some(st => filters.sessionTypes!.includes(st))
      );
    }

    if (filters?.modalities && filters.modalities.length > 0) {
      filtered = filtered.filter(t =>
        t.modalities?.some(m => filters.modalities!.includes(m))
      );
    }

    if (filters?.ageGroups && filters.ageGroups.length > 0) {
      filtered = filtered.filter(t =>
        t.ageGroups?.some(ag => filters.ageGroups!.includes(ag))
      );
    }

    if (filters?.insurance && filters.insurance.length > 0) {
      filtered = filtered.filter(t =>
        t.insuranceAccepted?.some(i => filters.insurance!.includes(i))
      );
    }

    if (filters?.communities && filters.communities.length > 0) {
      filtered = filtered.filter(t =>
        t.communitiesServed?.some(c => filters.communities!.includes(c))
      );
    }

    // NEW FILTERS - Phase 1: Core Matching
    if (filters?.gender && filters.gender.length > 0) {
      filtered = filtered.filter(t =>
        t.gender && filters.gender!.includes(t.gender)
      );
    }

    if (filters?.certifications && filters.certifications.length > 0) {
      filtered = filtered.filter(t =>
        t.certifications?.some(c => filters.certifications!.includes(c))
      );
    }

    if (filters?.sessionLengths && filters.sessionLengths.length > 0) {
      filtered = filtered.filter(t =>
        t.sessionLengthOptions?.some(sl => filters.sessionLengths!.includes(sl))
      );
    }

    if (filters?.availableImmediately) {
      filtered = filtered.filter(t =>
        (t.currentWaitlistWeeks || 0) === 0
      );
    }

    // NEW FILTERS - Phase 2: Accessibility
    if (filters?.wheelchairAccessible) {
      filtered = filtered.filter(t => t.wheelchairAccessible === true);
    }

    if (filters?.aslCapable) {
      filtered = filtered.filter(t => t.aslCapable === true);
    }

    if (filters?.serviceAnimalFriendly) {
      filtered = filtered.filter(t => t.serviceAnimalFriendly === true);
    }

    if (filters?.virtualPlatforms && filters.virtualPlatforms.length > 0) {
      filtered = filtered.filter(t =>
        t.virtualPlatforms?.some(vp => filters.virtualPlatforms!.includes(vp))
      );
    }

    // NEW FILTERS - Phase 3: Financial
    if (filters?.consultationOffered) {
      filtered = filtered.filter(t => t.consultationOffered === true);
    }

    if (filters?.superbillProvided) {
      filtered = filtered.filter(t => t.superbillProvided === true);
    }

    if (filters?.fsaHsaAccepted) {
      filtered = filtered.filter(t => t.fsaHsaAccepted === true);
    }

    // Sort
    if (filters?.sortBy === 'price-low') {
      filtered.sort((a, b) => (a.individualSessionFee || 0) - (b.individualSessionFee || 0));
    } else if (filters?.sortBy === 'price-high') {
      filtered.sort((a, b) => (b.individualSessionFee || 0) - (a.individualSessionFee || 0));
    } else if (filters?.sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }

  async getPendingTherapists(): Promise<Therapist[]> {
    return await db.select().from(therapists).where(eq(therapists.profileStatus, 'pending'));
  }

  async approveTherapist(id: string): Promise<Therapist> {
    const [updated] = await db
      .update(therapists)
      .set({ profileStatus: 'approved', updatedAt: new Date() })
      .where(eq(therapists.id, id))
      .returning();
    return updated;
  }

  async rejectTherapist(id: string): Promise<Therapist> {
    const [updated] = await db
      .update(therapists)
      .set({ profileStatus: 'rejected', updatedAt: new Date() })
      .where(eq(therapists.id, id))
      .returning();
    return updated;
  }

  async incrementProfileViews(id: string): Promise<void> {
    await db
      .update(therapists)
      .set({ profileViews: sql`${therapists.profileViews} + 1` })
      .where(eq(therapists.id, id));
  }

  // Admin users
  async createAdminUser(insertAdminUser: InsertAdminUser): Promise<AdminUser> {
    const [adminUser] = await db.insert(adminUsers).values(insertAdminUser).returning();
    return adminUser;
  }

  async getAdminUserByUserId(userId: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.userId, userId)).limit(1);
    return adminUser;
  }

  async isAdmin(userId: string): Promise<boolean> {
    const adminUser = await this.getAdminUserByUserId(userId);
    return !!adminUser;
  }

  // Appointment Scheduling - Availability
  async createAvailability(insertAvailability: InsertAvailability): Promise<TherapistAvailability> {
    const [availability] = await db.insert(therapistAvailability).values(insertAvailability).returning();
    return availability;
  }

  async getAvailability(therapistId: string): Promise<TherapistAvailability[]> {
    return await db
      .select()
      .from(therapistAvailability)
      .where(and(
        eq(therapistAvailability.therapistId, therapistId),
        eq(therapistAvailability.isActive, true)
      ));
  }

  async updateAvailability(id: string, data: Partial<InsertAvailability>): Promise<TherapistAvailability> {
    const [updated] = await db
      .update(therapistAvailability)
      .set(data)
      .where(eq(therapistAvailability.id, id))
      .returning();
    return updated;
  }

  async deleteAvailability(id: string): Promise<void> {
    await db.delete(therapistAvailability).where(eq(therapistAvailability.id, id));
  }

  // Appointment Scheduling - Booking Settings
  async getBookingSettings(therapistId: string): Promise<BookingSettings | undefined> {
    const [settings] = await db
      .select()
      .from(therapistBookingSettings)
      .where(eq(therapistBookingSettings.therapistId, therapistId))
      .limit(1);
    return settings;
  }

  async createBookingSettings(insertSettings: InsertBookingSettings): Promise<BookingSettings> {
    const [settings] = await db.insert(therapistBookingSettings).values(insertSettings).returning();
    return settings;
  }

  async updateBookingSettings(therapistId: string, data: Partial<InsertBookingSettings>): Promise<BookingSettings> {
    const [updated] = await db
      .update(therapistBookingSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(therapistBookingSettings.therapistId, therapistId))
      .returning();
    return updated;
  }

  // Appointment Scheduling - Appointments
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db.insert(appointments).values(insertAppointment).returning();
    return appointment;
  }

  async getAppointments(therapistId: string, status?: string): Promise<Appointment[]> {
    const conditions = [eq(appointments.therapistId, therapistId)];

    if (status) {
      conditions.push(eq(appointments.status, status as any));
    }

    return await db
      .select()
      .from(appointments)
      .where(and(...conditions))
      .orderBy(appointments.appointmentDate, appointments.startTime);
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    return appointment;
  }

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment> {
    const [updated] = await db
      .update(appointments)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }

  async cancelAppointment(id: string): Promise<Appointment> {
    const [updated] = await db
      .update(appointments)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }

  // Appointment Scheduling - Blocked Time
  async createBlockedTime(insertBlocked: InsertBlockedTime): Promise<BlockedTime> {
    const [blocked] = await db.insert(blockedTimeSlots).values(insertBlocked).returning();
    return blocked;
  }

  async getBlockedTimes(therapistId: string): Promise<BlockedTime[]> {
    return await db
      .select()
      .from(blockedTimeSlots)
      .where(eq(blockedTimeSlots.therapistId, therapistId));
  }

  async deleteBlockedTime(id: string): Promise<void> {
    await db.delete(blockedTimeSlots).where(eq(blockedTimeSlots.id, id));
  }

  // Appointment Scheduling - Availability Checking
  async getAvailableSlots(therapistId: string, date: string): Promise<TimeSlot[]> {
    // Get therapist profile with availability data
    const therapist = await this.getTherapistById(therapistId);
    if (!therapist) {
      return [];
    }

    // Get the day of week (0 = Sunday, 1 = Monday, etc.)
    // Parse date as UTC to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = dateObj.getUTCDay();

    // Map day of week to day name
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // Check if therapist is available on this day
    if (!therapist.availableDays || !therapist.availableDays.includes(dayName)) {
      return [];
    }

    // Check if therapist has available times
    if (!therapist.availableTimes || therapist.availableTimes.length === 0) {
      return [];
    }

    // Get existing appointments for this date
    const existingAppointments = await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.therapistId, therapistId),
        eq(appointments.appointmentDate, date),
        or(
          eq(appointments.status, 'pending'),
          eq(appointments.status, 'confirmed')
        )
      ));

    // Get blocked times for this date
    const blocked = await db
      .select()
      .from(blockedTimeSlots)
      .where(and(
        eq(blockedTimeSlots.therapistId, therapistId),
        lte(blockedTimeSlots.startDate, date),
        gte(blockedTimeSlots.endDate, date)
      ));

    // Generate time slots based on available times
    const slots: TimeSlot[] = [];
    const slotDuration = 60; // 1 hour slots

    // Define time ranges for morning, afternoon, evening
    const timeRanges: Record<string, { start: number; end: number }> = {
      'morning': { start: 8 * 60, end: 12 * 60 },    // 8:00 AM - 12:00 PM
      'afternoon': { start: 12 * 60, end: 17 * 60 }, // 12:00 PM - 5:00 PM
      'evening': { start: 17 * 60, end: 21 * 60 }    // 5:00 PM - 9:00 PM
    };

    // Generate slots for each available time period
    for (const timePeriod of therapist.availableTimes) {
      const range = timeRanges[timePeriod.toLowerCase()];
      if (!range) continue;

      let currentTime = range.start;
      while (currentTime + slotDuration <= range.end) {
        const hours = Math.floor(currentTime / 60);
        const mins = currentTime % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

        // Check if this slot is already booked
        const isBooked = existingAppointments.some(apt => apt.startTime === timeStr);

        // Check if this slot is blocked
        const isBlocked = blocked.some(b => {
          if (!b.startTime || !b.endTime) return true; // Full day block
          return timeStr >= b.startTime && timeStr < b.endTime;
        });

        slots.push({
          time: timeStr,
          available: !isBooked && !isBlocked,
          duration: slotDuration
        });

        currentTime += slotDuration;
      }
    }

    return slots.sort((a, b) => a.time.localeCompare(b.time));
  }
}

export const storage = new DbStorage();
