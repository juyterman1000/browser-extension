import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useGameStore } from '@/stores/gameStore';

interface ExecutiveFunctionHelperProps {
  onTaskCreated?: (task: any) => void;
  onTaskCompleted?: (taskId: string) => void;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number; // in minutes
  energy: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  subtasks?: SubTask[];
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

const TASK_TEMPLATES = {
  work: [
    { title: 'Check emails', estimatedTime: 15, energy: 'low' },
    { title: 'Review daily calendar', estimatedTime: 5, energy: 'low' },
    { title: 'Complete project task', estimatedTime: 45, energy: 'high' },
    { title: 'Team meeting', estimatedTime: 30, energy: 'medium' }
  ],
  personal: [
    { title: 'Respond to personal messages', estimatedTime: 10, energy: 'low' },
    { title: 'Grocery shopping', estimatedTime: 45, energy: 'medium' },
    { title: 'Exercise/movement', estimatedTime: 30, energy: 'high' },
    { title: 'Meal prep', estimatedTime: 60, energy: 'medium' }
  ],
  admin: [
    { title: 'Pay bills', estimatedTime: 20, energy: 'low' },
    { title: 'Schedule appointments', estimatedTime: 15, energy: 'low' },
    { title: 'Organize documents', estimatedTime: 30, energy: 'medium' },
    { title: 'Update budget', estimatedTime: 25, energy: 'medium' }
  ]
};

const ENERGY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800', 
  high: 'bg-red-100 text-red-800'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export const ExecutiveFunctionHelper: React.FC<ExecutiveFunctionHelperProps> = ({
  onTaskCreated,
  onTaskCompleted
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedView, setSelectedView] = useState<'today' | 'energy' | 'priority'>('today');
  const [currentEnergyLevel, setCurrentEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    priority: 'medium',
    estimatedTime: 30,
    energy: 'medium',
    category: 'work'
  });
  const { awardXP, awardDopamineCoins, updateStats } = useGameStore();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const result = await chrome.storage.local.get(['executiveFunctionTasks']);
      setTasks(result.executiveFunctionTasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await chrome.storage.local.set({ executiveFunctionTasks: updatedTasks });
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const createTask = () => {
    if (!newTask.title?.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority || 'medium',
      estimatedTime: newTask.estimatedTime || 30,
      energy: newTask.energy || 'medium',
      category: newTask.category || 'work',
      completed: false,
      createdAt: Date.now(),
      subtasks: []
    };

    const updatedTasks = [task, ...tasks];
    saveTasks(updatedTasks);

    // Award XP for planning ahead
    awardXP(3, 'Task created! Planning ahead! 📋');
    
    updateStats({
      tasksCreated: (prev: number) => prev + 1
    });

    onTaskCreated?.(task);
    setNewTask({ title: '', priority: 'medium', estimatedTime: 30, energy: 'medium', category: 'work' });
    setShowTaskForm(false);
  };

  const completeTask = (taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const completedTask = { ...task, completed: true, completedAt: Date.now() };
        
        // Award XP and coins based on task properties
        const xpReward = task.priority === 'urgent' ? 10 : task.priority === 'high' ? 8 : 5;
        const coinReward = Math.floor(task.estimatedTime / 10); // 1 coin per 10 minutes
        
        awardXP(xpReward, `Task completed! ${task.title} ✅`);
        awardDopamineCoins(coinReward, 'Task completion reward!');
        
        updateStats({
          tasksCompleted: (prev: number) => prev + 1,
          totalTimeEstimated: (prev: number) => prev + task.estimatedTime
        });

        onTaskCompleted?.(taskId);
        return completedTask;
      }
      return task;
    });

    saveTasks(updatedTasks);
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    saveTasks(updatedTasks);
  };

  const getTasksByView = () => {
    const activeTasks = tasks.filter(task => !task.completed);
    
    switch (selectedView) {
      case 'energy':
        return activeTasks.filter(task => task.energy === currentEnergyLevel);
      case 'priority':
        return activeTasks.sort((a, b) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
      default: // today
        return activeTasks.slice(0, 5); // Show top 5 for today
    }
  };

  const addTaskFromTemplate = (template: any, category: string) => {
    const task: Task = {
      id: Date.now().toString(),
      title: template.title,
      priority: 'medium',
      estimatedTime: template.estimatedTime,
      energy: template.energy,
      category,
      completed: false,
      createdAt: Date.now(),
      subtasks: []
    };

    const updatedTasks = [task, ...tasks];
    saveTasks(updatedTasks);
    
    awardXP(2, 'Quick task added! 🚀');
  };



  const getTotalTimeForView = () => {
    return getTasksByView().reduce((total, task) => total + task.estimatedTime, 0);
  };

  const getCompletionStats = () => {
    const completedToday = tasks.filter(task => 
      task.completed && 
      new Date(task.completedAt || 0).toDateString() === new Date().toDateString()
    );
    
    const totalTimeCompleted = completedToday.reduce((total, task) => total + task.estimatedTime, 0);
    
    return {
      count: completedToday.length,
      time: totalTimeCompleted
    };
  };

  const displayTasks = getTasksByView();
  const totalTime = getTotalTimeForView();
  const completionStats = getCompletionStats();

  if (showTaskForm) {
    return (
      <motion.div
        className="bg-white rounded-xl shadow-lg p-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">➕ Create New Task</h3>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Energy Level</label>
              <select
                value={newTask.energy}
                onChange={(e) => setNewTask({ ...newTask, energy: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Energy</option>
                <option value="medium">Medium Energy</option>
                <option value="high">High Energy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (min)</label>
              <input
                type="number"
                value={newTask.estimatedTime}
                onChange={(e) => setNewTask({ ...newTask, estimatedTime: parseInt(e.target.value) || 30 })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="5"
                step="5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="admin">Admin</option>
                <option value="health">Health</option>
                <option value="learning">Learning</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              onClick={createTask}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Task
            </motion.button>
            <button
              onClick={() => setShowTaskForm(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Quick Templates */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Add Templates</h4>
          <div className="space-y-3">
            {Object.entries(TASK_TEMPLATES).map(([category, templates]) => (
              <div key={category}>
                <h5 className="text-xs font-medium text-gray-600 mb-2 capitalize">{category}</h5>
                <div className="grid grid-cols-1 gap-2">
                  {templates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => addTaskFromTemplate(template, category)}
                      className="text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span>{template.title}</span>
                        <div className="flex gap-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${ENERGY_COLORS[template.energy as keyof typeof ENERGY_COLORS]}`}>
                            {template.energy}
                          </span>
                          <span className="text-xs text-gray-500">{template.estimatedTime}min</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">🧠 Executive Function</h3>
        <button
          onClick={() => setShowTaskForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">{completionStats.count}</div>
          <div className="text-xs text-green-800">Completed Today</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{Math.floor(totalTime / 60)}h {totalTime % 60}m</div>
          <div className="text-xs text-blue-800">Time Planned</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-lg font-bold text-purple-600">{Math.floor(completionStats.time / 60)}h {completionStats.time % 60}m</div>
          <div className="text-xs text-purple-800">Time Completed</div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'today', label: 'Today', icon: '📅' },
          { key: 'energy', label: 'Energy Match', icon: '⚡' },
          { key: 'priority', label: 'Priority', icon: '🎯' }
        ].map(view => (
          <button
            key={view.key}
            onClick={() => setSelectedView(view.key as any)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              selectedView === view.key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {view.icon} {view.label}
          </button>
        ))}
      </div>

      {/* Energy Level Selector (for energy view) */}
      {selectedView === 'energy' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Energy Level</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map(level => (
              <button
                key={level}
                onClick={() => setCurrentEnergyLevel(level)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors capitalize ${
                  currentEnergyLevel === level
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {displayTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎉</div>
            <p>No tasks for this view!</p>
            {selectedView === 'today' && (
              <p className="text-sm mt-1">Ready to plan your day?</p>
            )}
          </div>
        ) : (
          displayTasks.map(task => (
            <motion.div
              key={task.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 mb-1">{task.title}</h4>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${ENERGY_COLORS[task.energy]}`}>
                      {task.energy} energy
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                      {task.estimatedTime}min
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {task.category}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <motion.button
                    onClick={() => completeTask(task.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Complete task"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                  </motion.button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete task"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};