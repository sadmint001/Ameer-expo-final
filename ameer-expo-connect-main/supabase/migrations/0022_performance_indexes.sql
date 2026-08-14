-- Performance indexes for foreign key columns
create index if not exists connections_target_id_idx on public.connections(target_id);
create index if not exists user_bookmarks_session_id_idx on public.user_bookmarks(session_id);
