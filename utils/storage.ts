import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Job, Bid, WorkOrder, Review, SkillProgress, QuizAttempt } from '@/types';
import { SERVICE_TYPES } from '@/data/serviceTypes';

const STORAGE_KEYS = {
  CURRENT_USER: '@cacauserv:current_user',
  USERS: '@cacauserv:users',
  JOBS: '@cacauserv:jobs',
  BIDS: '@cacauserv:bids',
  WORK_ORDERS: '@cacauserv:work_orders',
  REVIEWS: '@cacauserv:reviews',
  SKILL_PROGRESS: '@cacauserv:skill_progress',
  QUIZ_ATTEMPTS: '@cacauserv:quiz_attempts',
  INITIALIZED: '@cacauserv:initialized',
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const initializeStorage = async (): Promise<void> => {
  try {
    const initialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const setCurrentUser = async (user: User | null): Promise<void> => {
  try {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (error) {
    console.error('Error setting current user:', error);
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const users = await getUsers();
    return users.find((u) => u.id === id) || null;
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
};

export const createUser = async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
  try {
    const users = await getUsers();
    const existingUser = users.find((u) => u.email === user.email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }
    const newUser: User = {
      ...user,
      id: generateId(),
      createdAt: new Date().toISOString(),
      level: user.role === 'worker' ? 1 : undefined,
      totalReviews: user.role === 'worker' ? 0 : undefined,
      averageRating: user.role === 'worker' ? 0 : undefined,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([...users, newUser]));
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const users = await getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      await setCurrentUser(users[index]);
    }
    return users[index];
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const users = await getUsers();
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Email ou senha inválidos');
    }
    await setCurrentUser(user);
    return user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  await setCurrentUser(null);
};

export const getJobs = async (): Promise<Job[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.JOBS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting jobs:', error);
    return [];
  }
};

export const getJobById = async (id: string): Promise<Job | null> => {
  try {
    const jobs = await getJobs();
    return jobs.find((j) => j.id === id) || null;
  } catch (error) {
    console.error('Error getting job by id:', error);
    return null;
  }
};

export const getJobsByProducer = async (producerId: string): Promise<Job[]> => {
  try {
    const jobs = await getJobs();
    return jobs.filter((j) => j.producerId === producerId);
  } catch (error) {
    console.error('Error getting jobs by producer:', error);
    return [];
  }
};

export const getOpenJobs = async (workerLevel: number = 1): Promise<Job[]> => {
  try {
    const jobs = await getJobs();
    return jobs.filter((j) => {
      if (j.status !== 'open') return false;
      const serviceType = SERVICE_TYPES.find((s) => s.id === j.serviceTypeId);
      return serviceType && workerLevel >= serviceType.minLevel;
    });
  } catch (error) {
    console.error('Error getting open jobs:', error);
    return [];
  }
};

export const createJob = async (job: Omit<Job, 'id' | 'status' | 'createdAt'>): Promise<Job> => {
  try {
    const jobs = await getJobs();
    const newJob: Job = {
      ...job,
      id: generateId(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify([...jobs, newJob]));
    return newJob;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

export const updateJob = async (jobId: string, updates: Partial<Job>): Promise<Job | null> => {
  try {
    const jobs = await getJobs();
    const index = jobs.findIndex((j) => j.id === jobId);
    if (index === -1) return null;
    jobs[index] = { ...jobs[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
    return jobs[index];
  } catch (error) {
    console.error('Error updating job:', error);
    return null;
  }
};

export const getBids = async (): Promise<Bid[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BIDS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting bids:', error);
    return [];
  }
};

export const getBidsByJob = async (jobId: string): Promise<Bid[]> => {
  try {
    const bids = await getBids();
    return bids.filter((b) => b.jobId === jobId);
  } catch (error) {
    console.error('Error getting bids by job:', error);
    return [];
  }
};

export const getBidsByWorker = async (workerId: string): Promise<Bid[]> => {
  try {
    const bids = await getBids();
    return bids.filter((b) => b.workerId === workerId);
  } catch (error) {
    console.error('Error getting bids by worker:', error);
    return [];
  }
};

export const createBid = async (bid: Omit<Bid, 'id' | 'status' | 'createdAt'>): Promise<Bid> => {
  try {
    const bids = await getBids();
    const existingBid = bids.find((b) => b.jobId === bid.jobId && b.workerId === bid.workerId);
    if (existingBid) {
      return await updateBid(existingBid.id, { price: bid.price, message: bid.message }) as Bid;
    }
    const newBid: Bid = {
      ...bid,
      id: generateId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify([...bids, newBid]));
    return newBid;
  } catch (error) {
    console.error('Error creating bid:', error);
    throw error;
  }
};

export const updateBid = async (bidId: string, updates: Partial<Bid>): Promise<Bid | null> => {
  try {
    const bids = await getBids();
    const index = bids.findIndex((b) => b.id === bidId);
    if (index === -1) return null;
    bids[index] = { ...bids[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(bids));
    return bids[index];
  } catch (error) {
    console.error('Error updating bid:', error);
    return null;
  }
};

export const getWorkOrders = async (): Promise<WorkOrder[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WORK_ORDERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting work orders:', error);
    return [];
  }
};

export const getWorkOrderById = async (id: string): Promise<WorkOrder | null> => {
  try {
    const workOrders = await getWorkOrders();
    return workOrders.find((wo) => wo.id === id) || null;
  } catch (error) {
    console.error('Error getting work order by id:', error);
    return null;
  }
};

export const getWorkOrderByJobId = async (jobId: string): Promise<WorkOrder | null> => {
  try {
    const workOrders = await getWorkOrders();
    return workOrders.find((wo) => wo.jobId === jobId) || null;
  } catch (error) {
    console.error('Error getting work order by job id:', error);
    return null;
  }
};

export const getWorkOrdersByWorker = async (workerId: string): Promise<WorkOrder[]> => {
  try {
    const workOrders = await getWorkOrders();
    return workOrders.filter((wo) => wo.workerId === workerId);
  } catch (error) {
    console.error('Error getting work orders by worker:', error);
    return [];
  }
};

export const getWorkOrdersByProducer = async (producerId: string): Promise<WorkOrder[]> => {
  try {
    const workOrders = await getWorkOrders();
    return workOrders.filter((wo) => wo.producerId === producerId);
  } catch (error) {
    console.error('Error getting work orders by producer:', error);
    return [];
  }
};

export const getActiveWorkOrderByWorker = async (workerId: string): Promise<WorkOrder | null> => {
  try {
    const workOrders = await getWorkOrdersByWorker(workerId);
    return workOrders.find((wo) => wo.status !== 'completed') || null;
  } catch (error) {
    console.error('Error getting active work order:', error);
    return null;
  }
};

export const createWorkOrder = async (
  jobId: string,
  workerId: string,
  producerId: string,
  finalPrice: number
): Promise<WorkOrder> => {
  try {
    const workOrders = await getWorkOrders();
    const newWorkOrder: WorkOrder = {
      id: generateId(),
      jobId,
      workerId,
      producerId,
      finalPrice,
      status: 'assigned',
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify([...workOrders, newWorkOrder]));
    await updateJob(jobId, { status: 'assigned' });
    return newWorkOrder;
  } catch (error) {
    console.error('Error creating work order:', error);
    throw error;
  }
};

export const updateWorkOrder = async (
  workOrderId: string,
  updates: Partial<WorkOrder>
): Promise<WorkOrder | null> => {
  try {
    const workOrders = await getWorkOrders();
    const index = workOrders.findIndex((wo) => wo.id === workOrderId);
    if (index === -1) return null;
    workOrders[index] = { ...workOrders[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify(workOrders));
    if (updates.status === 'completed') {
      await updateJob(workOrders[index].jobId, { status: 'closed' });
    }
    return workOrders[index];
  } catch (error) {
    console.error('Error updating work order:', error);
    return null;
  }
};

export const getReviews = async (): Promise<Review[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting reviews:', error);
    return [];
  }
};

export const getReviewsByWorkOrder = async (workOrderId: string): Promise<Review[]> => {
  try {
    const reviews = await getReviews();
    return reviews.filter((r) => r.workOrderId === workOrderId);
  } catch (error) {
    console.error('Error getting reviews by work order:', error);
    return [];
  }
};

export const getReviewsByUser = async (userId: string): Promise<Review[]> => {
  try {
    const reviews = await getReviews();
    return reviews.filter((r) => r.revieweeId === userId);
  } catch (error) {
    console.error('Error getting reviews by user:', error);
    return [];
  }
};

export const createReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> => {
  try {
    const reviews = await getReviews();
    const existingReview = reviews.find(
      (r) => r.workOrderId === review.workOrderId && r.reviewerId === review.reviewerId
    );
    if (existingReview) {
      throw new Error('Você já avaliou este serviço');
    }
    const newReview: Review = {
      ...review,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([...reviews, newReview]));
    if (review.reviewerRole === 'producer') {
      await updateWorkerLevel(review.revieweeId);
    }
    return newReview;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const updateWorkerLevel = async (workerId: string): Promise<void> => {
  try {
    const reviews = await getReviewsByUser(workerId);
    if (reviews.length === 0) return;
    const producerReviews = reviews.filter((r) => r.reviewerRole === 'producer');
    if (producerReviews.length === 0) return;
    const avgRating =
      producerReviews.reduce((sum, r) => {
        const avg = (r.quality + r.safety + r.punctuality + r.communication + r.fairness) / 5;
        return sum + avg;
      }, 0) / producerReviews.length;
    let newLevel: number = 1;
    if (producerReviews.length >= 20 && avgRating >= 4.5) {
      newLevel = 5;
    } else if (producerReviews.length >= 15 && avgRating >= 4.3) {
      newLevel = 4;
    } else if (producerReviews.length >= 10 && avgRating >= 4.0) {
      newLevel = 3;
    } else if (producerReviews.length >= 5 && avgRating >= 3.5) {
      newLevel = 2;
    }
    await updateUser(workerId, {
      level: newLevel as 1 | 2 | 3 | 4 | 5,
      totalReviews: producerReviews.length,
      averageRating: Math.round(avgRating * 10) / 10,
    });
  } catch (error) {
    console.error('Error updating worker level:', error);
  }
};

export const acceptBid = async (bidId: string): Promise<WorkOrder> => {
  try {
    const bids = await getBids();
    const bid = bids.find((b) => b.id === bidId);
    if (!bid) throw new Error('Proposta não encontrada');
    const job = await getJobById(bid.jobId);
    if (!job) throw new Error('Demanda não encontrada');
    const jobBids = bids.filter((b) => b.jobId === bid.jobId);
    for (const b of jobBids) {
      if (b.id === bidId) {
        await updateBid(b.id, { status: 'accepted' });
      } else {
        await updateBid(b.id, { status: 'rejected' });
      }
    }
    const workOrder = await createWorkOrder(bid.jobId, bid.workerId, job.producerId, bid.price);
    return workOrder;
  } catch (error) {
    console.error('Error accepting bid:', error);
    throw error;
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

export const getAllSkillProgress = async (userId: string): Promise<SkillProgress[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_PROGRESS);
    const allProgress: SkillProgress[] = data ? JSON.parse(data) : [];
    return allProgress.filter((p) => p.skillId.startsWith(userId + '_') || allProgress.some(sp => sp.skillId === p.skillId));
  } catch (error) {
    console.error('Error getting all skill progress:', error);
    return [];
  }
};

export const getSkillProgress = async (userId: string, skillId: string): Promise<SkillProgress | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_PROGRESS);
    const allProgress: SkillProgress[] = data ? JSON.parse(data) : [];
    const key = `${userId}_${skillId}`;
    return allProgress.find((p) => p.skillId === key) || null;
  } catch (error) {
    console.error('Error getting skill progress:', error);
    return null;
  }
};

export const updateSkillProgress = async (
  userId: string,
  skillId: string,
  updates: Partial<SkillProgress>
): Promise<SkillProgress> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_PROGRESS);
    const allProgress: SkillProgress[] = data ? JSON.parse(data) : [];
    const key = `${userId}_${skillId}`;
    const index = allProgress.findIndex((p) => p.skillId === key);
    
    const defaultProgress: SkillProgress = {
      skillId: key,
      xpTotal: 0,
      level: 'teaser',
      coursesCompleted: [],
      quizzesCompleted: [],
      updatedAt: new Date().toISOString(),
    };
    
    if (index === -1) {
      const newProgress = { ...defaultProgress, ...updates, skillId: key };
      allProgress.push(newProgress);
      await AsyncStorage.setItem(STORAGE_KEYS.SKILL_PROGRESS, JSON.stringify(allProgress));
      return newProgress;
    } else {
      allProgress[index] = { 
        ...allProgress[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      await AsyncStorage.setItem(STORAGE_KEYS.SKILL_PROGRESS, JSON.stringify(allProgress));
      return allProgress[index];
    }
  } catch (error) {
    console.error('Error updating skill progress:', error);
    throw error;
  }
};

export const addXPToSkill = async (
  userId: string,
  skillId: string,
  xpAmount: number,
  courseId?: string,
  quizResult?: { quizId: string; score: number }
): Promise<SkillProgress> => {
  try {
    const current = await getSkillProgress(userId, skillId);
    const currentXP = current?.xpTotal || 0;
    const coursesCompleted = current?.coursesCompleted || [];
    const quizzesCompleted = current?.quizzesCompleted || [];
    
    if (courseId && !coursesCompleted.includes(courseId)) {
      coursesCompleted.push(courseId);
    }
    
    if (quizResult) {
      const existingQuiz = quizzesCompleted.find(q => q.quizId === quizResult.quizId);
      if (existingQuiz) {
        if (quizResult.score > existingQuiz.bestScore) {
          existingQuiz.bestScore = quizResult.score;
        }
        existingQuiz.attempts++;
        existingQuiz.lastAttempt = new Date().toISOString();
      } else {
        quizzesCompleted.push({
          quizId: quizResult.quizId,
          bestScore: quizResult.score,
          attempts: 1,
          lastAttempt: new Date().toISOString(),
        });
      }
    }
    
    return await updateSkillProgress(userId, skillId, {
      xpTotal: currentXP + xpAmount,
      coursesCompleted,
      quizzesCompleted,
    });
  } catch (error) {
    console.error('Error adding XP to skill:', error);
    throw error;
  }
};

export const getQuizAttempts = async (userId: string, quizId: string): Promise<QuizAttempt[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
    const allAttempts: QuizAttempt[] = data ? JSON.parse(data) : [];
    return allAttempts.filter((a) => a.userId === userId && a.quizId === quizId);
  } catch (error) {
    console.error('Error getting quiz attempts:', error);
    return [];
  }
};

export const saveQuizAttempt = async (attempt: Omit<QuizAttempt, 'id' | 'createdAt'>): Promise<QuizAttempt> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
    const allAttempts: QuizAttempt[] = data ? JSON.parse(data) : [];
    
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    allAttempts.push(newAttempt);
    await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(allAttempts));
    return newAttempt;
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    throw error;
  }
};
