-- Demonstração dos exercícios de cardio (estavam sem imagem).
-- Fonte: free-exercise-db (domínio público, The Unlicense), a mesma dos demais
-- exercícios: dois quadros que o app alterna como animação.
update public.exercises set image_urls = array['https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bicycling_Stationary/0.jpg', 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bicycling_Stationary/1.jpg']
  where name = 'Bicicleta Ergométrica' and deleted_at is null and image_urls is null;
update public.exercises set image_urls = array['https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Walking_Treadmill/0.jpg', 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Walking_Treadmill/1.jpg']
  where name = 'Caminhada' and deleted_at is null and image_urls is null;
update public.exercises set image_urls = array['https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Running_Treadmill/0.jpg', 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Running_Treadmill/1.jpg']
  where name = 'Corrida na Esteira' and deleted_at is null and image_urls is null;
update public.exercises set image_urls = array['https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Elliptical_Trainer/0.jpg', 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Elliptical_Trainer/1.jpg']
  where name = 'Elíptico' and deleted_at is null and image_urls is null;
update public.exercises set image_urls = array['https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Stairmaster/0.jpg', 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Stairmaster/1.jpg']
  where name = 'Escada' and deleted_at is null and image_urls is null;
update public.exercises set image_urls = array['https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rope_Jumping/0.jpg', 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rope_Jumping/1.jpg']
  where name = 'Pular Corda' and deleted_at is null and image_urls is null;
update public.exercises set image_urls = array['https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rowing_Stationary/0.jpg', 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rowing_Stationary/1.jpg']
  where name = 'Remo Ergômetro' and deleted_at is null and image_urls is null;
