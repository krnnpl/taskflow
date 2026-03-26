import React, { useState, useEffect } from 'react';
import PageShell from '../../components/shared/PageShell';
import TaskTable from '../../components/shared/TaskTable';
import { taskAPI } from '../../utils/api';

export default function SATasks() {
  const [tasks, setTasks] = useState([]);
  const load = () => taskAPI.getAll().then(r => setTasks(r.data));
  useEffect(() => { load(); }, []);
  return (
    <PageShell title="All Tasks" subtitle="Full visibility across every task in the system">
      <TaskTable tasks={tasks} onDelete={async (id) => { if(window.confirm('Delete?')) { await taskAPI.delete(id); load(); } }} />
    </PageShell>
  );
}
