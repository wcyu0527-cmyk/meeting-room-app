export type Room = {
    id: string
    name: string
    capacity: number
    equipment: string[]
    image_url: string | null
    created_at: string
}

export type Booking = {
    id: string
    room_id: string
    user_id: string
    title: string
    start_time: string
    end_time: string
    notes?: string | null
    category?: string
    eco_box_count?: number
    no_packaging_count?: number
    takeout_count?: number
    cannot_comply_reason?: string
    approved_disposable_count?: number
    unit_id?: string
    unit_member_id?: string
    created_at: string
}

export type BookingWithRoom = Booking & {
    rooms: Room | null
    profile?: { full_name: string | null }
}

export type Profile = {
    id: string
    full_name: string | null
    avatar_url: string | null
    updated_at: string | null
}
