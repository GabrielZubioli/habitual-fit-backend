-- Receitas prontas (do sistema) para qualquer pessoa usar na dieta.
--
-- Receita com user_id NULL é do sistema: todos leem, ninguém edita. As da
-- pessoa continuam só dela. Ganham categoria, tempo e modo de preparo.

-- ── Esquema ────────────────────────────────────────────────────────────────

ALTER TABLE public.recipes ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.recipes
  ADD COLUMN category TEXT
    CHECK (category IS NULL OR category IN
      ('vitaminas', 'cafe-da-manha', 'sanduiches', 'pratos', 'saladas', 'lanches', 'bolos-e-doces')),
  ADD COLUMN prep_minutes SMALLINT CHECK (prep_minutes IS NULL OR prep_minutes BETWEEN 1 AND 600),
  ADD COLUMN instructions TEXT;

COMMENT ON COLUMN public.recipes.user_id IS 'Dono da receita. NULL = receita pronta do sistema, visível a todos.';

CREATE INDEX IF NOT EXISTS idx_recipes_system_category
  ON public.recipes (category) WHERE user_id IS NULL AND deleted_at IS NULL;

-- ── Acesso ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "own recipes" ON public.recipes;
CREATE POLICY "read own and system recipes" ON public.recipes
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = (select auth.uid()));
CREATE POLICY "insert own recipes" ON public.recipes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "update own recipes" ON public.recipes
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "delete own recipes" ON public.recipes
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "own recipe items" ON public.recipe_items;
CREATE POLICY "read own and system recipe items" ON public.recipe_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_items.recipe_id
      AND (r.user_id IS NULL OR r.user_id = (select auth.uid()))
  ));
CREATE POLICY "write own recipe items" ON public.recipe_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_items.recipe_id AND r.user_id = (select auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_items.recipe_id AND r.user_id = (select auth.uid())
  ));

-- ── Alimentos que as receitas fit pedem e a TACO não tem ───────────────────

INSERT INTO public.foods
  (owner_id, external_id, name, source, category, serving_size_g, serving_unit,
   kcal, protein_g, carbs_g, fat_g, fiber_g, popularity, is_staple, is_public)
SELECT * FROM (VALUES
  (NULL::uuid, 'receitas:pasta-amendoim', 'Pasta de amendoim integral', 'custom',
   'fat'::public.food_category_t, 100::numeric, 'g', 588::numeric, 25::numeric, 20::numeric, 50::numeric, 6::numeric, 70, FALSE, TRUE),
  (NULL::uuid, 'receitas:granola', 'Granola tradicional', 'custom',
   'grain'::public.food_category_t, 100::numeric, 'g', 420::numeric, 10::numeric, 66::numeric, 13::numeric, 7::numeric, 60, FALSE, TRUE),
  (NULL::uuid, 'receitas:cacau-po', 'Cacau em pó 100%', 'custom',
   'other'::public.food_category_t, 100::numeric, 'g', 228::numeric, 19.6::numeric, 57.9::numeric, 13.7::numeric, 37::numeric, 40, FALSE, TRUE)
) AS novos(owner_id, external_id, name, source, category, serving_size_g, serving_unit,
           kcal, protein_g, carbs_g, fat_g, fiber_g, popularity, is_staple, is_public)
WHERE NOT EXISTS (SELECT 1 FROM public.foods f WHERE f.external_id = novos.external_id);

-- ── Receitas ───────────────────────────────────────────────────────────────

-- Cria uma receita do sistema com os ingredientes pelo nome exato do
-- catálogo. Ingrediente inexistente aborta a migração: receita pela metade
-- seria pior que nenhuma.
CREATE FUNCTION pg_temp.receita(
  p_nome TEXT, p_categoria TEXT, p_porcoes INT, p_minutos INT, p_preparo TEXT, p_itens JSONB
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_id UUID;
  v_item JSONB;
  v_food UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.recipes WHERE user_id IS NULL AND name = p_nome) THEN
    RETURN;
  END IF;
  INSERT INTO public.recipes (user_id, name, servings, category, prep_minutes, instructions)
  VALUES (NULL, p_nome, p_porcoes, p_categoria, p_minutos, p_preparo)
  RETURNING id INTO v_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens) LOOP
    SELECT id INTO v_food FROM public.foods
    WHERE name = v_item->>0 AND owner_id IS NULL AND deleted_at IS NULL
    ORDER BY created_at
    LIMIT 1;
    IF v_food IS NULL THEN
      RAISE EXCEPTION 'Receita "%": alimento "%" não existe no catálogo', p_nome, v_item->>0;
    END IF;
    INSERT INTO public.recipe_items (recipe_id, food_id, grams)
    VALUES (v_id, v_food, (v_item->>1)::NUMERIC);
  END LOOP;
END $$;

-- Vitaminas e shakes ---------------------------------------------------------
SELECT pg_temp.receita('Vitamina de banana com aveia', 'vitaminas', 1, 5,
  'Bata tudo no liquidificador por 1 minuto. Sirva gelada.',
  '[["Leite integral",300],["Banana prata",100],["Aveia em flocos",30],["Mel, de abelha",10]]');
SELECT pg_temp.receita('Shake proteico de morango', 'vitaminas', 1, 5,
  'Bata o leite, o whey e os morangos até ficar cremoso. Gelo deixa mais encorpado.',
  '[["Leite integral",250],["Whey protein (média)",30],["Morango, cru",100]]');
SELECT pg_temp.receita('Shake de banana e pasta de amendoim', 'vitaminas', 1, 5,
  'Bata tudo no liquidificador. Ótimo pós-treino para quem quer ganhar massa.',
  '[["Leite integral",300],["Banana prata",120],["Pasta de amendoim integral",20],["Whey protein (média)",30],["Aveia em flocos",30]]');
SELECT pg_temp.receita('Vitamina de abacate', 'vitaminas', 1, 5,
  'Bata o abacate com o leite e o mel. Sirva gelada.',
  '[["Abacate, cru",100],["Leite integral",250],["Mel, de abelha",15]]');
SELECT pg_temp.receita('Vitamina de mamão com laranja', 'vitaminas', 1, 5,
  'Bata o mamão com o suco de laranja e a aveia. Beba na hora.',
  '[["Mamão, Papaia, cru",150],["Laranja, pêra, suco",200],["Aveia em flocos",15]]');
SELECT pg_temp.receita('Smoothie de manga com iogurte', 'vitaminas', 1, 5,
  'Bata a manga com o iogurte e a aveia até ficar liso.',
  '[["Manga, Palmer, crua",150],["Iogurte natural",170],["Aveia em flocos",15]]');
SELECT pg_temp.receita('Shake de chocolate com aveia', 'vitaminas', 1, 5,
  'Bata o leite, o whey, o cacau, a aveia e a banana. Fica com gosto de milk-shake.',
  '[["Leite integral",250],["Whey protein (média)",30],["Cacau em pó 100%",10],["Aveia em flocos",30],["Banana prata",80]]');
SELECT pg_temp.receita('Suco verde detox', 'vitaminas', 1, 5,
  'Bata a couve com o suco de laranja, a maçã e o limão. Coe se preferir.',
  '[["Couve, manteiga, crua",30],["Laranja, pêra, suco",250],["Maçã, Fuji, com casca, crua",100],["Limão, tahiti, cru",20]]');
SELECT pg_temp.receita('Açaí na tigela', 'vitaminas', 1, 10,
  'Bata o açaí congelado com metade da banana até virar creme. Cubra com a granola, o resto da banana em rodelas e o mel.',
  '[["Açaí, polpa, congelada",200],["Banana prata",80],["Granola tradicional",30],["Mel, de abelha",10]]');

-- Café da manhã ---------------------------------------------------------------
SELECT pg_temp.receita('Ovos mexidos com pão integral', 'cafe-da-manha', 1, 10,
  'Bata os ovos, mexa na frigideira com a manteiga em fogo baixo até firmar. Sirva com o pão.',
  '[["Ovo, de galinha, inteiro, cru",100],["Pão, trigo, forma, integral",50],["Manteiga, com sal",5]]');
SELECT pg_temp.receita('Tapioca de frango com queijo', 'cafe-da-manha', 1, 10,
  'Espalhe a goma na frigideira quente até grudar. Recheie com o frango desfiado e o queijo e dobre.',
  '[["Fécula, de mandioca",50],["Frango, peito, sem pele, cozido",60],["Queijo minas frescal",30]]');
SELECT pg_temp.receita('Crepioca de queijo', 'cafe-da-manha', 1, 10,
  'Misture os ovos com a goma, despeje na frigideira untada e vire. Recheie com a mussarela.',
  '[["Ovo, de galinha, inteiro, cru",100],["Fécula, de mandioca",20],["Queijo, mozarela",20]]');
SELECT pg_temp.receita('Mingau de aveia com banana', 'cafe-da-manha', 1, 10,
  'Cozinhe a aveia no leite mexendo por 5 minutos. Sirva com a banana em rodelas e o mel.',
  '[["Leite integral",250],["Aveia em flocos",40],["Banana prata",80],["Mel, de abelha",10]]');
SELECT pg_temp.receita('Panqueca de banana fit', 'cafe-da-manha', 1, 10,
  'Amasse a banana, misture os ovos e a aveia. Doure dos dois lados em frigideira antiaderente.',
  '[["Banana prata",100],["Ovo, de galinha, inteiro, cru",100],["Aveia em flocos",30]]');
SELECT pg_temp.receita('Omelete de legumes', 'cafe-da-manha', 1, 15,
  'Refogue a cebola, o tomate e o espinafre. Junte os ovos batidos e o queijo, tampe e cozinhe em fogo baixo.',
  '[["Ovo, de galinha, inteiro, cru",150],["Tomate",50],["Cebola, crua",20],["Espinafre, Nova Zelândia, cru",30],["Queijo minas frescal",30]]');
SELECT pg_temp.receita('Iogurte com frutas e granola', 'cafe-da-manha', 1, 5,
  'Monte em camadas: iogurte, frutas picadas e granola. Finalize com o mel.',
  '[["Iogurte natural",170],["Morango, cru",80],["Banana prata",60],["Granola tradicional",25],["Mel, de abelha",10]]');
SELECT pg_temp.receita('Cuscuz nordestino com ovo', 'cafe-da-manha', 1, 15,
  'Sirva o cuscuz quente com a manteiga e os ovos cozidos por cima.',
  '[["Cuscuz, de milho, cozido com sal",150],["Ovo, de galinha, inteiro, cozido/10minutos",100],["Manteiga, com sal",5]]');
SELECT pg_temp.receita('Pão de queijo com café com leite', 'cafe-da-manha', 1, 5,
  'Aqueça o pão de queijo e sirva com o café passado e o leite.',
  '[["Pão, de queijo, assado",80],["Café, infusão 10%",150],["Leite integral",50]]');
SELECT pg_temp.receita('Torrada com ricota e tomate', 'cafe-da-manha', 1, 5,
  'Espalhe a ricota nas torradas e cubra com o tomate em rodelas. Tempere a gosto.',
  '[["Torrada, pão francês",30],["Queijo, ricota",50],["Tomate",50]]');

-- Sanduíches ------------------------------------------------------------------
SELECT pg_temp.receita('Sanduíche natural de frango', 'sanduiches', 1, 10,
  'Misture o frango desfiado com a ricota e a cenoura ralada. Monte no pão com a alface.',
  '[["Pão, trigo, forma, integral",50],["Frango, peito, sem pele, cozido",80],["Queijo, ricota",30],["Cenoura, crua",20],["Alface",15]]');
SELECT pg_temp.receita('Sanduíche de atum', 'sanduiches', 1, 10,
  'Escorra o atum e misture com o iogurte. Monte no pão com o tomate e a alface.',
  '[["Pão, trigo, forma, integral",50],["Atum, conserva em óleo",60],["Iogurte natural",20],["Tomate",30],["Alface",15]]');
SELECT pg_temp.receita('Misto quente', 'sanduiches', 1, 10,
  'Monte o pão com o presunto e a mussarela, passe manteiga por fora e doure na frigideira ou sanduicheira.',
  '[["Pão, trigo, forma, integral",50],["Presunto, sem capa de gordura",30],["Queijo, mozarela",30],["Manteiga, com sal",5]]');
SELECT pg_temp.receita('Hambúrguer caseiro', 'sanduiches', 1, 20,
  'Grelhe o hambúrguer, derreta o queijo por cima e monte no pão com tomate, alface e cebola.',
  '[["Pão, trigo, sovado",70],["Hambúrguer, bovino, grelhado",120],["Queijo, prato",20],["Tomate",30],["Alface",15],["Cebola, crua",15]]');
SELECT pg_temp.receita('Sanduíche de peito de peru', 'sanduiches', 1, 5,
  'Monte o pão com o peito de peru, o queijo branco, a rúcula e o tomate.',
  '[["Pão, trigo, forma, integral",50],["Peru, congelado, assado",60],["Queijo minas frescal",30],["Rúcula, crua",10],["Tomate",30]]');
SELECT pg_temp.receita('Pão francês com ovo e queijo', 'sanduiches', 1, 10,
  'Frite o ovo, cubra com a mussarela para derreter e coloque no pão.',
  '[["Pão francês",50],["Ovo, de galinha, inteiro, frito",50],["Queijo, mozarela",20]]');
SELECT pg_temp.receita('Sanduíche de frango com abacate', 'sanduiches', 1, 10,
  'Amasse o abacate com limão e sal, espalhe no pão e cubra com o frango e o tomate.',
  '[["Pão, trigo, forma, integral",50],["Frango, peito, sem pele, grelhado",80],["Abacate, cru",40],["Tomate",30],["Limão, tahiti, cru",5]]');

-- Pratos ----------------------------------------------------------------------
SELECT pg_temp.receita('Frango grelhado com arroz, feijão e salada', 'pratos', 1, 30,
  'Grelhe o frango temperado. Sirva com o arroz, o feijão e a salada temperada com o azeite.',
  '[["Frango, peito, sem pele, grelhado",150],["Arroz, tipo 1, cozido",150],["Feijão, carioca, cozido",100],["Alface",30],["Tomate",50],["Azeite, de oliva, extra virgem",5]]');
SELECT pg_temp.receita('Carne moída com batata-doce e brócolis', 'pratos', 1, 30,
  'Refogue a carne moída com cebola e alho. Sirva com a batata-doce e o brócolis cozidos.',
  '[["Carne, bovina, acém, moído, cozido",130],["Batata, doce, cozida",200],["Brócolis, cozido",80]]');
SELECT pg_temp.receita('Salmão grelhado com legumes', 'pratos', 1, 30,
  'Grelhe o salmão com sal e limão. Sirva com as batatas, o brócolis e a cenoura no vapor regados com o azeite.',
  '[["Salmão, sem pele, fresco, grelhado",150],["Batata, inglesa, cozida",150],["Brócolis, cozido",80],["Cenoura, cozida",60],["Azeite, de oliva, extra virgem",5]]');
SELECT pg_temp.receita('Estrogonofe de frango com arroz', 'pratos', 1, 30,
  'Sirva o estrogonofe quente com o arroz branco.',
  '[["Estrogonofe de frango",200],["Arroz, tipo 1, cozido",150]]');
SELECT pg_temp.receita('Macarrão à bolonhesa', 'pratos', 1, 30,
  'Sirva o macarrão com o molho à bolonhesa e finalize com o parmesão ralado.',
  '[["Macarrão, molho bolognesa",300],["Queijo, parmesão",10]]');
SELECT pg_temp.receita('Prato feito: bife, arroz, feijão e salada', 'pratos', 1, 30,
  'Grelhe o bife, sirva com o arroz, o feijão preto e a salada.',
  '[["Carne, bovina, contra-filé, sem gordura, grelhado",120],["Arroz, tipo 1, cozido",150],["Feijão, preto, cozido",100],["Alface",20],["Tomate",50]]');
SELECT pg_temp.receita('Peixe assado com purê de batata', 'pratos', 1, 35,
  'Asse o peixe temperado. Amasse a batata com o leite e a manteiga para o purê. Sirva com a salada.',
  '[["Merluza, filé, assado",150],["Batata, inglesa, cozida",150],["Leite integral",30],["Manteiga, com sal",5],["Alface",30],["Tomate",50]]');
SELECT pg_temp.receita('Escondidinho de carne seca', 'pratos', 4, 60,
  'Amasse a mandioca com a manteiga. Em um refratário, faça uma camada de carne seca desfiada, cubra com o purê e o queijo e gratine.',
  '[["Carne, bovina, seca, cozida",400],["Mandioca, cozida",800],["Manteiga, com sal",20],["Queijo, mozarela",120]]');
SELECT pg_temp.receita('Frango com açafrão e arroz integral', 'pratos', 1, 35,
  'Sirva o frango ao açafrão com o arroz integral e a vagem refogada.',
  '[["Frango, com açafrão",180],["Arroz, integral, cozido",150],["Vagem, crua",80]]');
SELECT pg_temp.receita('Lasanha à bolonhesa', 'pratos', 6, 70,
  'Intercale massa, carne moída com molho de tomate e mussarela em um refratário. Finalize com parmesão e asse por 30 minutos.',
  '[["Lasanha, massa fresca, cozida",500],["Carne, bovina, acém, moído, cozido",500],["Tomate, molho industrializado",400],["Queijo, mozarela",250],["Queijo, parmesão",40]]');
SELECT pg_temp.receita('Feijoada com arroz e couve', 'pratos', 1, 20,
  'Sirva a feijoada com o arroz, a couve refogada e a laranja em gomos.',
  '[["Feijoada",250],["Arroz, tipo 1, cozido",120],["Couve, manteiga, refogada",50],["Laranja, pêra, crua",100]]');
SELECT pg_temp.receita('Carne de panela com legumes', 'pratos', 4, 90,
  'Doure a carne, cubra com água e cozinhe na pressão por 40 minutos. Junte os legumes e cozinhe mais 10.',
  '[["Carne, bovina, músculo, sem gordura, cozido",600],["Batata, inglesa, cozida",480],["Cenoura, cozida",320],["Chuchu, cozido",240]]');
SELECT pg_temp.receita('Baião de dois com queijo coalho', 'pratos', 1, 20,
  'Sirva o baião quente com o queijo em cubos grelhado por cima.',
  '[["Baião de dois, arroz e feijão-de-corda",250],["Queijo, minas, meia cura",40]]');
SELECT pg_temp.receita('Yakisoba', 'pratos', 1, 20,
  'Aqueça o yakisoba e sirva na hora.',
  '[["Yakisoba",350]]');

-- Saladas ---------------------------------------------------------------------
SELECT pg_temp.receita('Salada de frango com grão-de-bico', 'saladas', 1, 15,
  'Cozinhe o grão-de-bico (dobra de peso). Misture com o frango, as folhas e os legumes e tempere com o azeite.',
  '[["Frango, peito, sem pele, cozido",120],["Grão-de-bico, cru",40],["Alface",40],["Tomate",60],["Pepino, cru",50],["Azeite, de oliva, extra virgem",10]]');
SELECT pg_temp.receita('Salada caprese', 'saladas', 1, 10,
  'Intercale rodelas de tomate e mussarela, finalize com manjericão e azeite.',
  '[["Tomate",150],["Queijo, mozarela",60],["Manjericão, cru",5],["Azeite, de oliva, extra virgem",10]]');
SELECT pg_temp.receita('Salada de atum com ovo', 'saladas', 1, 15,
  'Monte as folhas, o tomate, o milho, o atum escorrido e o ovo em quartos. Regue com o azeite.',
  '[["Atum, conserva em óleo",80],["Alface",40],["Tomate",60],["Milho, verde, enlatado, drenado",40],["Ovo, de galinha, inteiro, cozido/10minutos",50],["Azeite, de oliva, extra virgem",5]]');
SELECT pg_temp.receita('Tabule', 'saladas', 1, 10,
  'Sirva o tabule gelado, com um fio de limão.',
  '[["Tabule",250],["Limão, tahiti, cru",10]]');
SELECT pg_temp.receita('Salada de legumes no vapor', 'saladas', 1, 20,
  'Cozinhe os legumes no vapor até ficarem macios e tempere com o azeite e sal.',
  '[["Brócolis, cozido",80],["Cenoura, cozida",60],["Couve-flor, cozida",80],["Abobrinha, italiana, cozida",60],["Azeite, de oliva, extra virgem",5]]');

-- Lanches ---------------------------------------------------------------------
SELECT pg_temp.receita('Mix de castanhas', 'lanches', 1, 1,
  'Misture as castanhas. Uma porção pequena já sustenta até a próxima refeição.',
  '[["Castanha-de-caju, torrada, salgada",15],["Castanha-do-Brasil, crua",10],["Amêndoa, torrada, salgada",15]]');
SELECT pg_temp.receita('Banana com pasta de amendoim', 'lanches', 1, 2,
  'Corte a banana em rodelas e cubra com a pasta de amendoim.',
  '[["Banana prata",100],["Pasta de amendoim integral",15]]');
SELECT pg_temp.receita('Pipoca caseira', 'lanches', 1, 5,
  'Estoure o milho na panela com um fio de óleo e sal.',
  '[["Pipoca, com óleo de soja, sem sal",30]]');
SELECT pg_temp.receita('Iogurte com mel e aveia', 'lanches', 1, 2,
  'Misture o iogurte com a aveia e o mel.',
  '[["Iogurte natural",170],["Aveia em flocos",20],["Mel, de abelha",10]]');
SELECT pg_temp.receita('Maçã com queijo branco', 'lanches', 1, 2,
  'Fatie a maçã e sirva com cubos de queijo minas.',
  '[["Maçã, Fuji, com casca, crua",130],["Queijo minas frescal",40]]');
SELECT pg_temp.receita('Ovos cozidos', 'lanches', 1, 12,
  'Cozinhe os ovos por 10 minutos, esfrie em água fria e descasque.',
  '[["Ovo, de galinha, inteiro, cozido/10minutos",100]]');

-- Bolos e doces ---------------------------------------------------------------
SELECT pg_temp.receita('Bolo de banana com aveia', 'bolos-e-doces', 10, 50,
  'Amasse as bananas, misture os ovos, o óleo e o açúcar. Junte a aveia e o fermento. Asse a 180 °C por 35 minutos.',
  '[["Banana prata",300],["Ovo, de galinha, inteiro, cru",150],["Aveia em flocos",120],["Açúcar, mascavo",60],["Óleo, de canola",40],["Fermento em pó, químico",10]]');
SELECT pg_temp.receita('Bolo de cenoura com cobertura de chocolate', 'bolos-e-doces', 12, 60,
  'Bata a cenoura, os ovos, o óleo e o açúcar. Misture a farinha e o fermento e asse a 180 °C por 40 minutos. Derreta o chocolate com o creme de leite para a cobertura.',
  '[["Cenoura, crua",300],["Ovo, de galinha, inteiro, cru",150],["Óleo, de soja",120],["Açúcar, refinado",250],["Farinha, de trigo",250],["Fermento em pó, químico",15],["Chocolate, meio amargo",100],["Creme de Leite",100]]');
SELECT pg_temp.receita('Bolo de chocolate', 'bolos-e-doces', 12, 50,
  'Misture os secos, junte os ovos, o leite e o óleo. Asse a 180 °C por 35 minutos.',
  '[["Farinha, de trigo",240],["Achocolatado, pó",100],["Açúcar, refinado",200],["Ovo, de galinha, inteiro, cru",150],["Leite integral",240],["Óleo, de soja",120],["Fermento em pó, químico",15]]');
SELECT pg_temp.receita('Bolo de fubá', 'bolos-e-doces', 12, 50,
  'Bata os ovos, o leite, o óleo e o açúcar. Misture o fubá, a farinha e o fermento. Asse a 180 °C por 40 minutos.',
  '[["Milho, fubá, cru",200],["Farinha, de trigo",100],["Açúcar, refinado",200],["Ovo, de galinha, inteiro, cru",150],["Leite integral",240],["Óleo, de soja",120],["Fermento em pó, químico",15]]');
SELECT pg_temp.receita('Bolo de laranja', 'bolos-e-doces', 12, 50,
  'Bata os ovos, o óleo, o açúcar e o suco. Misture a farinha e o fermento. Asse a 180 °C por 35 minutos.',
  '[["Farinha, de trigo",250],["Açúcar, refinado",200],["Ovo, de galinha, inteiro, cru",150],["Óleo, de soja",100],["Laranja, pêra, suco",240],["Fermento em pó, químico",15]]');
SELECT pg_temp.receita('Bolo de cacau fit', 'bolos-e-doces', 10, 45,
  'Amasse as bananas, misture os ovos, o cacau, a aveia e o fermento. Asse a 180 °C por 30 minutos.',
  '[["Banana prata",250],["Ovo, de galinha, inteiro, cru",150],["Aveia em flocos",100],["Cacau em pó 100%",30],["Mel, de abelha",40],["Fermento em pó, químico",10]]');
SELECT pg_temp.receita('Brigadeiro proteico', 'bolos-e-doces', 10, 15,
  'Misture o leite em pó, o whey e o cacau com o leite até virar massa. Enrole as bolinhas e leve à geladeira.',
  '[["Leite, de vaca, desnatado, pó",60],["Whey protein (média)",30],["Cacau em pó 100%",15],["Leite integral",50]]');
SELECT pg_temp.receita('Pudim de leite', 'bolos-e-doces', 10, 80,
  'Bata o leite condensado, o leite e os ovos. Despeje na forma caramelizada com o açúcar e asse em banho-maria por 1 hora.',
  '[["Leite, condensado",395],["Leite integral",395],["Ovo, de galinha, inteiro, cru",150],["Açúcar, refinado",100]]');
SELECT pg_temp.receita('Mousse de maracujá', 'bolos-e-doces', 8, 15,
  'Bata o suco, o leite condensado e o creme de leite por 3 minutos. Leve à geladeira por 3 horas.',
  '[["Maracujá, suco concentrado, envasado",200],["Leite, condensado",395],["Creme de Leite",200]]');
SELECT pg_temp.receita('Cookies de banana e aveia', 'bolos-e-doces', 12, 30,
  'Amasse a banana, misture a aveia e o chocolate picado. Faça bolinhas achatadas e asse a 180 °C por 15 minutos.',
  '[["Banana prata",200],["Aveia em flocos",150],["Chocolate, meio amargo",50]]');
