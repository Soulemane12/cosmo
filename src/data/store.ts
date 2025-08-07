// Types
export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  provider_id: string;
};

export type CartItem = {
  id: string;
  serviceId: string;
  providerId: string;
  quantity: number;
};

export type Cart = {
  id: string;
  userId: string;
  items: CartItem[];
};

export type Provider = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  location: string;
  services: Service[];
  email: string;
  user_type: 'provider';
};

export type RequestStatus = 'pending' | 'claimed' | 'accepted' | 'declined' | 'completed';

export type ServiceRequest = {
  id: string;
  userId: string;
  providerId: string;
  serviceId: string;
  status: RequestStatus;
  requestDate: string;
  scheduledDate?: string;
  notes?: string;
  claimedAt?: string;
  claimedBy?: string;
  expiresAt?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  location: string;
  user_type: 'user' | 'provider';
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  type: 'user' | 'provider';
};

export type NotificationType = 'request_created' | 'request_claimed' | 'request_accepted' | 'request_declined' | 'request_completed';

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedRequestId?: string;
  isRead: boolean;
  createdAt: string;
};

import { supabase } from '../lib/supabase';
import { signUpUser, signInUser, signOutUser, getCurrentUser } from '../lib/auth';

// Auth functions
export const loginUser = async (email: string, password: string): Promise<AuthUser | null> => {
  try {
    const result = await signInUser(email, password);
    
    if (!result.success || !result.data) {
      return null;
    }

    const user = result.data.user;
    if (!user) {
      return null;
    }

    // Get user details from the users table
    const { data: userDetails, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !userDetails) {
      return null;
    }

    return {
      id: user.id,
      name: userDetails.name,
      email: user.email || '',
      type: userDetails.user_type
    };
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const registerUser = async (userData: Omit<User, 'id'>): Promise<User | null> => {
  try {
    // First, sign up with Supabase auth
    const result = await signUpUser(userData.email, userData.email, {
      name: userData.name,
      location: userData.location,
      user_type: 'user'
    });

    if (!result.success || !result.data) {
      console.error('Registration error:', result.error);
      return null;
    }

    const user = result.data.user;
    if (!user) {
      return null;
    }

    // Create user record in the users table
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        name: userData.name,
        email: userData.email,
        location: userData.location,
        user_type: 'user'
      })
      .select()
      .single();

    if (error) {
      console.error('User creation error:', error);
      return null;
    }

    // Create a cart for the new user
    await createCartForUser(newUser.id);

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      location: newUser.location,
      user_type: newUser.user_type
    };
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
};

export const registerProvider = async (providerData: Omit<Provider, 'id' | 'rating' | 'services'>): Promise<Provider | null> => {
  try {
    // First, sign up with Supabase auth
    const result = await signUpUser(providerData.email, providerData.email, {
      name: providerData.name,
      location: providerData.location,
      user_type: 'provider'
    });

    if (!result.success || !result.data) {
      console.error('Provider registration error:', result.error);
      return null;
    }

    const user = result.data.user;
    if (!user) {
      return null;
    }

    // Create user record in the users table
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        name: providerData.name,
        email: providerData.email,
        location: providerData.location,
        user_type: 'provider'
      })
      .select()
      .single();

    if (userError) {
      console.error('Provider user creation error:', userError);
      return null;
    }

    // Create provider profile
    const { error: profileError } = await supabase
      .from('provider_profiles')
      .insert({
        user_id: newUser.id,
        specialty: providerData.specialty,
        rating: 0
      });

    if (profileError) {
      console.error('Provider profile creation error:', profileError);
      return null;
    }

    return {
      id: newUser.id,
      name: newUser.name,
      specialty: providerData.specialty,
      rating: 0,
      location: newUser.location,
      services: [],
      email: newUser.email,
      user_type: 'provider'
    };
  } catch (error) {
    console.error('Provider registration error:', error);
    return null;
  }
};

// Service functions
export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !service) return null;

    return {
      id: service.id,
      name: service.name,
      description: service.description || '',
      price: service.price,
      category: service.category,
      image: service.image_url || undefined,
      provider_id: service.provider_id
    };
  } catch (error) {
    console.error('Get service error:', error);
    return null;
  }
};

export const getAllServices = async (): Promise<Service[]> => {
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('*');

    if (error) {
      console.error('Get services error:', error);
      return [];
    }

    return services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description || '',
      price: service.price,
      category: service.category,
      image: service.image_url || undefined,
      provider_id: service.provider_id
    }));
  } catch (error) {
    console.error('Get services error:', error);
    return [];
  }
};

export const createNewService = async (service: Omit<Service, 'id'>, providerId: string): Promise<Service | null> => {
  try {
    const { data: newService, error } = await supabase
      .from('services')
      .insert({
        name: service.name,
        description: service.description,
        price: service.price,
        category: service.category,
        image_url: service.image,
        provider_id: providerId
      })
      .select()
      .single();

    if (error || !newService) return null;

    return {
      id: newService.id,
      name: newService.name,
      description: newService.description || '',
      price: newService.price,
      category: newService.category,
      image: newService.image_url || undefined,
      provider_id: newService.provider_id
    };
  } catch (error) {
    console.error('Create service error:', error);
    return null;
  }
};

// Provider functions
export const getProviderById = async (id: string): Promise<Provider | null> => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('user_type', 'provider')
      .single();

    if (userError || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('provider_profiles')
      .select('*')
      .eq('user_id', id)
      .single();

    if (profileError) {
      console.error('Get provider profile error:', profileError);
      return null;
    }

    // Get provider's services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('provider_id', id);

    if (servicesError) {
      console.error('Get provider services error:', servicesError);
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      specialty: profile.specialty,
      rating: profile.rating,
      location: user.location,
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description || '',
        price: service.price,
        category: service.category,
        image: service.image_url || undefined,
        provider_id: service.provider_id
      })),
      email: user.email,
      user_type: 'provider'
    };
  } catch (error) {
    console.error('Get provider error:', error);
    return null;
  }
};

export const getAllProviders = async (): Promise<Provider[]> => {
  try {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'provider');

    if (userError) {
      console.error('Get providers error:', userError);
      return [];
    }

    const providers: Provider[] = [];

    for (const user of users) {
      const provider = await getProviderById(user.id);
      if (provider) {
        providers.push(provider);
      }
    }

    return providers;
  } catch (error) {
    console.error('Get providers error:', error);
    return [];
  }
};

export const getProviderByServiceId = async (serviceId: string): Promise<Provider | null> => {
  try {
    const { data: service, error } = await supabase
      .from('services')
      .select('provider_id')
      .eq('id', serviceId)
      .single();

    if (error || !service) return null;

    return await getProviderById(service.provider_id);
  } catch (error) {
    console.error('Get provider by service error:', error);
    return null;
  }
};

// User functions
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      location: user.location,
      user_type: user.user_type
    };
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

// Cart functions
const createCartForUser = async (userId: string): Promise<string | null> => {
  try {
    const { data: cart, error } = await supabase
      .from('carts')
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Create cart error:', error);
      return null;
    }

    return cart.id;
  } catch (error) {
    console.error('Create cart error:', error);
    return null;
  }
};

export const getCartByUserId = async (userId: string): Promise<Cart | null> => {
  try {
    // Get or create cart
    let { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (cartError && cartError.code === 'PGRST116') {
      // Cart doesn't exist, create one
      const cartId = await createCartForUser(userId);
      if (!cartId) return null;

      cart = { id: cartId, user_id: userId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    } else if (cartError) {
      console.error('Get cart error:', cartError);
      return null;
    }

    // Get cart items
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('Get cart items error:', itemsError);
      return null;
    }

    return {
      id: cart.id,
      userId: cart.user_id,
      items: items.map(item => ({
        id: item.id,
        serviceId: item.service_id,
        providerId: item.provider_id,
        quantity: item.quantity
      }))
    };
  } catch (error) {
    console.error('Get cart error:', error);
    return null;
  }
};

export const addToCart = async (userId: string, serviceId: string, providerId: string): Promise<CartItem | null> => {
  try {
    const cart = await getCartByUserId(userId);
    if (!cart) return null;

    // Check if item already exists
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('service_id', serviceId)
      .single();

    if (existingItem) {
      // Update quantity
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update cart item error:', updateError);
        return null;
      }

      return {
        id: updatedItem.id,
        serviceId: updatedItem.service_id,
        providerId: updatedItem.provider_id,
        quantity: updatedItem.quantity
      };
    } else {
      // Add new item
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          service_id: serviceId,
          provider_id: providerId,
          quantity: 1
        })
        .select()
        .single();

      if (insertError) {
        console.error('Add cart item error:', insertError);
        return null;
      }

      return {
        id: newItem.id,
        serviceId: newItem.service_id,
        providerId: newItem.provider_id,
        quantity: newItem.quantity
      };
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    return null;
  }
};

export const removeFromCart = async (userId: string, cartItemId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) {
      console.error('Remove from cart error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Remove from cart error:', error);
    return false;
  }
};

export const updateCartItemQuantity = async (userId: string, cartItemId: string, quantity: number): Promise<CartItem | null> => {
  if (quantity < 1) return null;

  try {
    const { data: updatedItem, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) {
      console.error('Update cart item quantity error:', error);
      return null;
    }

    return {
      id: updatedItem.id,
      serviceId: updatedItem.service_id,
      providerId: updatedItem.provider_id,
      quantity: updatedItem.quantity
    };
  } catch (error) {
    console.error('Update cart item quantity error:', error);
    return null;
  }
};

export const clearCart = async (userId: string): Promise<void> => {
  try {
    const cart = await getCartByUserId(userId);
    if (!cart) return;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (error) {
      console.error('Clear cart error:', error);
    }
  } catch (error) {
    console.error('Clear cart error:', error);
  }
};

// Request functions
export const getAllServiceRequests = async (): Promise<ServiceRequest[]> => {
  try {
    const { data: requests, error } = await supabase
      .from('service_requests')
      .select('*');

    if (error) {
      console.error('Get service requests error:', error);
      return [];
    }

    return requests.map(request => ({
      id: request.id,
      userId: request.user_id,
      providerId: request.provider_id,
      serviceId: request.service_id,
      status: request.status,
      requestDate: request.request_date,
      scheduledDate: request.scheduled_date || undefined,
      notes: request.notes || undefined,
      claimedAt: request.claimed_at || undefined,
      claimedBy: request.claimed_by || undefined,
      expiresAt: request.expires_at || undefined
    }));
  } catch (error) {
    console.error('Get service requests error:', error);
    return [];
  }
};

export const getServiceRequestsByUserId = async (userId: string): Promise<ServiceRequest[]> => {
  try {
    const { data: requests, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Get user service requests error:', error);
      return [];
    }

    return requests.map(request => ({
      id: request.id,
      userId: request.user_id,
      providerId: request.provider_id,
      serviceId: request.service_id,
      status: request.status,
      requestDate: request.request_date,
      scheduledDate: request.scheduled_date || undefined,
      notes: request.notes || undefined,
      claimedAt: request.claimed_at || undefined,
      claimedBy: request.claimed_by || undefined,
      expiresAt: request.expires_at || undefined
    }));
  } catch (error) {
    console.error('Get user service requests error:', error);
    return [];
  }
};

export const getServiceRequestsByProviderId = async (providerId: string): Promise<ServiceRequest[]> => {
  try {
    const { data: requests, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('provider_id', providerId);

    if (error) {
      console.error('Get provider service requests error:', error);
      return [];
    }

    return requests.map(request => ({
      id: request.id,
      userId: request.user_id,
      providerId: request.provider_id,
      serviceId: request.service_id,
      status: request.status,
      requestDate: request.request_date,
      scheduledDate: request.scheduled_date || undefined,
      notes: request.notes || undefined,
      claimedAt: request.claimed_at || undefined,
      claimedBy: request.claimed_by || undefined,
      expiresAt: request.expires_at || undefined
    }));
  } catch (error) {
    console.error('Get provider service requests error:', error);
    return [];
  }
};

export const getUnclaimedServiceRequests = async (): Promise<ServiceRequest[]> => {
  try {
    const { data: requests, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('status', 'pending')
      .is('provider_id', null);

    if (error) {
      console.error('Get unclaimed service requests error:', error);
      return [];
    }

    return requests.map(request => ({
      id: request.id,
      userId: request.user_id,
      providerId: request.provider_id,
      serviceId: request.service_id,
      status: request.status,
      requestDate: request.request_date,
      scheduledDate: request.scheduled_date || undefined,
      notes: request.notes || undefined,
      claimedAt: request.claimed_at || undefined,
      claimedBy: request.claimed_by || undefined,
      expiresAt: request.expires_at || undefined
    }));
  } catch (error) {
    console.error('Get unclaimed service requests error:', error);
    return [];
  }
};

export const getClaimedServiceRequests = async (providerId: string): Promise<ServiceRequest[]> => {
  try {
    const { data: requests, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('status', 'claimed')
      .eq('claimed_by', providerId);

    if (error) {
      console.error('Get claimed service requests error:', error);
      return [];
    }

    return requests.map(request => ({
      id: request.id,
      userId: request.user_id,
      providerId: request.provider_id,
      serviceId: request.service_id,
      status: request.status,
      requestDate: request.request_date,
      scheduledDate: request.scheduled_date || undefined,
      notes: request.notes || undefined,
      claimedAt: request.claimed_at || undefined,
      claimedBy: request.claimed_by || undefined,
      expiresAt: request.expires_at || undefined
    }));
  } catch (error) {
    console.error('Get claimed service requests error:', error);
    return [];
  }
};

export const createServiceRequest = async (request: Omit<ServiceRequest, 'id'>): Promise<ServiceRequest | null> => {
  try {
    const { data: newRequest, error } = await supabase
      .from('service_requests')
      .insert({
        user_id: request.userId,
        provider_id: request.providerId,
        service_id: request.serviceId,
        status: request.status,
        request_date: request.requestDate,
        scheduled_date: request.scheduledDate,
        notes: request.notes
      })
      .select()
      .single();

    if (error || !newRequest) return null;

    return {
      id: newRequest.id,
      userId: newRequest.user_id,
      providerId: newRequest.provider_id,
      serviceId: newRequest.service_id,
      status: newRequest.status,
      requestDate: newRequest.request_date,
      scheduledDate: newRequest.scheduled_date || undefined,
      notes: newRequest.notes || undefined,
      claimedAt: newRequest.claimed_at || undefined,
      claimedBy: newRequest.claimed_by || undefined,
      expiresAt: newRequest.expires_at || undefined
    };
  } catch (error) {
    console.error('Create service request error:', error);
    return null;
  }
};

// New claiming system functions
export const claimServiceRequest = async (requestId: string, providerId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('claim_service_request', {
      request_id: requestId,
      claiming_provider_id: providerId
    });

    if (error) {
      console.error('Claim service request error:', error);
      return false;
    }

    return data;
  } catch (error) {
    console.error('Claim service request error:', error);
    return false;
  }
};

export const acceptClaimedRequest = async (requestId: string, providerId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('accept_claimed_request', {
      request_id: requestId,
      provider_id: providerId
    });

    if (error) {
      console.error('Accept claimed request error:', error);
      return false;
    }

    return data;
  } catch (error) {
    console.error('Accept claimed request error:', error);
    return false;
  }
};

export const declineClaimedRequest = async (requestId: string, providerId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('decline_claimed_request', {
      request_id: requestId,
      provider_id: providerId
    });

    if (error) {
      console.error('Decline claimed request error:', error);
      return false;
    }

    return data;
  } catch (error) {
    console.error('Decline claimed request error:', error);
    return false;
  }
};

export const updateServiceRequestStatus = async (id: string, status: RequestStatus, providerId?: string): Promise<ServiceRequest | null> => {
  try {
    const updateData: any = { status };
    if (providerId) {
      updateData.provider_id = providerId;
    }

    const { data: updatedRequest, error } = await supabase
      .from('service_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedRequest) return null;

    return {
      id: updatedRequest.id,
      userId: updatedRequest.user_id,
      providerId: updatedRequest.provider_id,
      serviceId: updatedRequest.service_id,
      status: updatedRequest.status,
      requestDate: updatedRequest.request_date,
      scheduledDate: updatedRequest.scheduled_date || undefined,
      notes: updatedRequest.notes || undefined,
      claimedAt: updatedRequest.claimed_at || undefined,
      claimedBy: updatedRequest.claimed_by || undefined,
      expiresAt: updatedRequest.expires_at || undefined
    };
  } catch (error) {
    console.error('Update service request error:', error);
    return null;
  }
};

// Notification functions
export const getNotificationsByUserId = async (userId: string): Promise<Notification[]> => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get notifications error:', error);
      return [];
    }

    return notifications.map(notification => ({
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedRequestId: notification.related_request_id || undefined,
      isRead: notification.is_read,
      createdAt: notification.created_at
    }));
  } catch (error) {
    console.error('Get notifications error:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Mark notification as read error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return false;
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Mark all notifications as read error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return false;
  }
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Get unread notification count error:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Get unread notification count error:', error);
    return 0;
  }
}; 