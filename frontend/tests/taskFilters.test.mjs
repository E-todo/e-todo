import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesTaskFilters } from '../src/utils/taskFilters.ts';
const today = '2026-11-11';
const task = {id:1, title:'Préparer le projet', description:'Présentation client', status:'todo', priority:'high', dueDate:today};
const filters = {search:'', status:'all', priority:'all', date:'all', tag:'all', focus:false};
test('quick filters combine search, priority, tags and dates', () => {
  assert.equal(matchesTaskFilters(task, ['Travail'], today, {...filters, date:'today', priority:'high', tag:'Travail', search:'CLIENT'}), true);
  assert.equal(matchesTaskFilters(task, [], today, {...filters, tag:'Travail'}), false);
  assert.equal(matchesTaskFilters(task, [], today, {...filters, priority:'low'}), false);
  assert.equal(matchesTaskFilters({...task, dueDate:undefined}, [], today, {...filters, date:'today'}), false);
});
test('concentration ignores existing filters without changing them and includes completed tasks today', () => {
  const saved = {...filters, search:'absent', date:'overdue', status:'todo', priority:'low', tag:'Autre', focus:true};
  assert.equal(matchesTaskFilters({...task, status:'completed'}, [], today, saved), true);
  assert.equal(matchesTaskFilters({...task, dueDate:'2026-11-10'}, [], today, saved), false);
  assert.equal(matchesTaskFilters(task, [], today, {...saved, focus:false}), false);
  assert.equal(saved.date, 'overdue');
});
test('overdue excludes completed and undated tasks', () => {
  const overdue = {...filters, date:'overdue'};
  assert.equal(matchesTaskFilters({...task, dueDate:'2026-11-10'}, [], today, overdue), true);
  assert.equal(matchesTaskFilters({...task, dueDate:'2026-11-10', status:'completed'}, [], today, overdue), false);
  assert.equal(matchesTaskFilters({...task, dueDate:undefined}, [], today, overdue), false);
});
