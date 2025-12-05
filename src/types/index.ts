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
    created_at: string
}

export type BookingWithRoom = Booking & {
    rooms: Room | null
}

export type Profile = {
    id: string
    full_name: string | null
    avatar_url: string | null
    updated_at: string | null
}
