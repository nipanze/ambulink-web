// ── AmbuLink Type Definitions ──────────────────────────────

export type UserRole = 'patient' | 'driver' | 'institution_rep' | 'admin'

export type DriverStatus = 'pending' | 'active' | 'suspended' | 'deactivated'

export type BookingType = 'emergency' | 'scheduled' | 'institutional' | 'highway'

export type BookingStatus =
  | 'requested' | 'assigned' | 'en_route' | 'at_scene'
  | 'transporting' | 'completed' | 'cancelled' | 'expired'

export type PaymentStatus = 'unpaid' | 'paid' | 'waived' | 'refunded'

export type VehicleType = 'basic' | 'advanced' | 'neonatal' | 'bariatric' | 'air'

export type InstitutionType = 'hospital' | 'clinic' | 'school' | 'ngo' | 'government' | 'corporate' | 'other'

export type InstitutionStatus = 'pending' | 'active' | 'rejected' | 'suspended'

export type RoadCorridor =
  | 'kampala_jinja' | 'kampala_masaka' | 'kampala_mbarara'
  | 'kampala_gulu'  | 'kampala_fort_portal' | 'kampala_mbale' | 'other'

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown'
export type GenderType = 'male' | 'female' | 'other' | 'prefer_not_to_say'

// ── Entity interfaces ──────────────────────────────────────

export interface User {
  id:            number
  email:         string | null
  first_name:    string | null
  last_name:     string | null
  phone:         string | null
  role:          UserRole
  fcm_token?:    string | null
  is_active:     boolean
  last_login?:   string | null
  created_at:    string
  updated_at:    string
}

export interface CurrentUser extends User {
  patient_profile?: Patient
  driver_profile?: Driver
  rep_profile?: InstitutionRep
}

export interface Patient {
  id:                      number
  user_id:                 number
  date_of_birth?:          string
  gender?:                 GenderType
  profile_photo_url?:      string
  national_id?:            string
  blood_group:             BloodGroup
  allergies?:              string
  chronic_conditions?:     string
  current_medications?:    string
  disability_notes?:       string
  emergency_contact_name?: string
  emergency_contact_phone?:string
  emergency_contact_rel?:  string
  preferred_hospital?:     string
  preferred_language:      string
  total_bookings:          number
  total_completed:         number
  total_cancelled:         number
  created_at:              string
  // joined
  user?:                   User
}

export interface Driver {
  id:              number
  user_id:         number
  license_number:  string
  vehicle_plate:   string
  vehicle_type:    VehicleType
  vehicle_model?:  string
  vehicle_color?:  string
  coverage_zone?:  string
  status:          DriverStatus
  is_online:       boolean
  total_trips:     number
  average_rating:  number
  verified_at?:    string
  created_at:      string
  // joined
  user?:           User
  location?:       DriverLocation
}

export interface DriverLocation {
  driver_id:  number
  latitude:   number
  longitude:  number
  heading?:   number
  speed_kmh?: number
  updated_at: string
}

export interface Institution {
  id:             number
  name:           string
  type:           InstitutionType
  address:        string
  latitude?:      number
  longitude?:     number
  contact_phone?: string
  contact_email?: string
  website?:       string
  status:         InstitutionStatus
  created_at:     string
}

export interface InstitutionRep {
  id:             number
  user_id:        number
  institution_id: number
  job_title?:     string | null
  is_primary:     boolean
  created_at:     string
  institution?:   Institution
}

export interface Booking {
  id:                    number
  booking_ref:           string
  patient_id:            number
  driver_id?:            number
  institution_id?:       number
  type:                  BookingType
  status:                BookingStatus
  pickup_latitude:       number
  pickup_longitude:      number
  pickup_address?:       string
  pickup_landmark?:      string
  destination_name?:     string
  destination_latitude?: number
  destination_longitude?:number
  destination_address?:  string
  scheduled_at?:         string
  assigned_at?:          string
  pickup_at?:            string
  dropoff_at?:           string
  cancelled_at?:         string
  cancellation_reason?:  string
  distance_km?:          number
  duration_minutes?:     number
  is_priority:           boolean
  patient_notes?:        string
  road_corridor?:        RoadCorridor
  highway_landmark?:     string
  fare_amount?:          number
  payment_status:        PaymentStatus
  created_at:            string
  updated_at:            string
  // joined
  patient?:               Patient
  patient_profile?:      Patient
  driver?:               Driver
  institution?:          Institution
}

export interface BookingOverview {
  booking_id:        number
  booking_ref:       string
  booking_type:      BookingType
  status:            BookingStatus
  is_priority:       boolean
  patient_name:      string
  patient_phone:     string
  patient_email:     string
  blood_group?:      BloodGroup
  allergies?:        string
  emergency_contact_name?: string
  emergency_contact_phone?:string
  pickup_address:    string
  pickup_latitude:   number
  pickup_longitude:  number
  destination_name?: string
  destination_address?: string
  driver_name?:      string
  driver_phone?:     string
  vehicle_plate?:    string
  vehicle_type?:     VehicleType
  driver_lat?:       number
  driver_lng?:       number
  institution_name?: string
  fare_amount?:      number
  payment_status:    PaymentStatus
  distance_km?:      number
  created_at:        string
  assigned_at?:      string
  scheduled_at?:     string
  dropoff_at?:       string
}

export interface Notification {
  id:                 number
  user_id:            number
  event:              string
  channel:            string
  status:             string
  title:              string
  body:               string
  related_booking_id?: number
  is_read:            boolean
  read_at?:           string
  sent_at?:           string
  created_at:         string
}

export interface DailyStats {
  stat_date:               string
  total_bookings:          number
  emergency_count:         number
  scheduled_count:         number
  institutional_count:     number
  highway_count:           number
  completed_count:         number
  cancelled_count:         number
  avg_assignment_minutes?: number
  avg_response_minutes?:   number
  avg_distance_km?:        number
  total_revenue?:          number
}
